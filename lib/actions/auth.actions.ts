"use server";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/database/mongoose";
import User from "@/database/models/user.model";
import { sendVerificationOtpEmail, sendPasswordResetOtpEmail } from "@/lib/resend";

const JWT_SECRET = process.env.JWT_SECRET || "chapterchat_fallback_super_secret_key_2026";
const COOKIE_NAME = "chapterchat_session";

// ============================================
// BUILT-IN CRYPTO UTILITIES (PBKDF2 & HMAC JWT)
// ============================================

function isPasswordHashed(passwordStr: string): boolean {
    if (!passwordStr) return false;
    if (passwordStr.startsWith("$2a$") || passwordStr.startsWith("$2b$") || passwordStr.startsWith("$2y$")) {
        return true;
    }
    const parts = passwordStr.split(":");
    return parts.length === 2 && parts[0].length === 32 && parts[1].length === 128;
}

export async function hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return `${salt}:${hash}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    if (!storedHash) return false;
    if (!isPasswordHashed(storedHash)) {
        // Fallback for unexpected direct equality if unhashed
        return password === storedHash;
    }
    const [salt, originalHash] = storedHash.split(":");
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return hash === originalHash;
}

function signJwtToken(payload: { userId: string }, secret: string): string {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const data = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString("base64url");
    const signature = crypto.createHmac("sha256", secret).update(`${header}.${data}`).digest("base64url");
    return `${header}.${data}.${signature}`;
}

function verifyJwtToken(token: string, secret: string): { userId: string; exp: number } | null {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const [header, data, signature] = parts;
        const expectedSignature = crypto.createHmac("sha256", secret).update(`${header}.${data}`).digest("base64url");
        if (signature !== expectedSignature) return null;

        const decoded = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
        if (decoded.exp && Date.now() > decoded.exp) return null;
        return decoded;
    } catch {
        return null;
    }
}

function generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createSessionToken(userId: string): Promise<string> {
    return signJwtToken({ userId }, JWT_SECRET);
}

export async function setSessionCookie(userId: string) {
    const token = await createSessionToken(userId);
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
    });
}

export async function clearSessionCookie() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(COOKIE_NAME)?.value;
        if (!token) return null;

        const decoded = verifyJwtToken(token, JWT_SECRET);
        if (!decoded || !decoded.userId) return null;

        await connectToDatabase();
        const userDoc = await User.findById(decoded.userId);
        if (!userDoc) return null;

        // Auto-promote darshtank05@gmail.com to admin role and sync in Admin collection
        if (userDoc.email.toLowerCase() === 'darshtank05@gmail.com') {
            if (userDoc.role !== 'admin') {
                userDoc.role = 'admin';
                await userDoc.save();
            }

            const { ensureAdminExists } = await import("@/lib/actions/admin.actions");
            await ensureAdminExists();
        }

        // Check if user is blocked
        if (userDoc.isBlocked) {
            await clearSessionCookie();
            return null;
        }

        const rawUser = userDoc.toObject();
        const hasPassword = Boolean(rawUser.password);
        const { password, verificationOtp, resetOtp, ...user } = rawUser;

        return {
            ...user,
            role: user.role || (user.email.toLowerCase() === 'darshtank05@gmail.com' ? 'admin' : 'user'),
            hasPassword,
            _id: user._id.toString(),
            createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: user.updatedAt ? new Date(user.updatedAt).toISOString() : new Date().toISOString(),
        };
    } catch (error) {
        return null;
    }
}

export async function registerUser(formData: { name: string; email: string; password: string }) {
    await connectToDatabase();
    const { name, email, password } = formData;

    const cleanEmail = email.toLowerCase().trim();
    let existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser && existingUser.isVerified) {
        return { success: false, error: "An account with this email already exists." };
    }

    const hashedPassword = await hashPassword(password);
    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (existingUser) {
        existingUser.name = name;
        existingUser.password = hashedPassword;
        existingUser.verificationOtp = otp;
        existingUser.verificationOtpExpiresAt = otpExpires;
        await existingUser.save();
    } else {
        existingUser = await User.create({
            name,
            email: cleanEmail,
            password: hashedPassword,
            isVerified: false,
            verificationOtp: otp,
            verificationOtpExpiresAt: otpExpires,
        });
    }

    await sendVerificationOtpEmail(cleanEmail, otp);
    return { success: true, email: cleanEmail };
}

export async function verifyEmailOtp(email: string, otp: string) {
    await connectToDatabase();
    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
        return { success: false, error: "User not found." };
    }

    if (!user.verificationOtp || user.verificationOtp !== otp.trim()) {
        return { success: false, error: "Invalid verification OTP code." };
    }

    if (user.verificationOtpExpiresAt && new Date() > new Date(user.verificationOtpExpiresAt)) {
        return { success: false, error: "OTP code has expired. Please request a new one." };
    }

    user.isVerified = true;
    user.verificationOtp = undefined;
    user.verificationOtpExpiresAt = undefined;
    await user.save();

    await setSessionCookie(user._id.toString());
    return { success: true };
}

export async function resendVerificationOtp(email: string) {
    await connectToDatabase();
    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
        return { success: false, error: "User not found." };
    }

    const otp = generateOtp();
    user.verificationOtp = otp;
    user.verificationOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendVerificationOtpEmail(cleanEmail, otp);
    return { success: true };
}

export async function loginUser(formData: { email: string; password: string }) {
    await connectToDatabase();
    const { email, password } = formData;
    const cleanEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: cleanEmail });
    if (!user || !user.password) {
        return { success: false, error: "Invalid email or password." };
    }

    if (user.isBlocked) {
        return {
            success: false,
            error: user.blockedReason
                ? `Account suspended: ${user.blockedReason}`
                : "Your account has been suspended by an administrator."
        };
    }

    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
        return { success: false, error: "Invalid email or password." };
    }

    if (!user.isVerified) {
        const otp = generateOtp();
        user.verificationOtp = otp;
        user.verificationOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();
        await sendVerificationOtpEmail(cleanEmail, otp);

        return { success: false, requiresVerification: true, email: cleanEmail };
    }

    await setSessionCookie(user._id.toString());
    return { success: true };
}

export async function logoutUser() {
    await clearSessionCookie();
    return { success: true };
}

export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    try {
        await connectToDatabase();
        const cleanEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: cleanEmail });

        if (!user) {
            return { success: true };
        }

        const otp = generateOtp();
        user.resetOtp = otp;
        user.resetOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        await sendPasswordResetOtpEmail(cleanEmail, otp);
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to request password reset code." };
    }
}

export async function verifyResetOtpAndChangePassword(email: string, otp: string, newPassword: string) {
    await connectToDatabase();
    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
        return { success: false, error: "Invalid request." };
    }

    if (!user.resetOtp || user.resetOtp !== otp.trim()) {
        return { success: false, error: "Invalid reset OTP code." };
    }

    if (user.resetOtpExpiresAt && new Date() > new Date(user.resetOtpExpiresAt)) {
        return { success: false, error: "Reset OTP code has expired." };
    }

    user.password = await hashPassword(newPassword);
    user.resetOtp = undefined;
    user.resetOtpExpiresAt = undefined;
    await user.save();

    return { success: true };
}

export async function updateUserProfile(data: { name?: string; image?: string }) {
    const currentUser = await getCurrentUser();
    if (!currentUser) return { success: false, error: "Unauthorized" };

    await connectToDatabase();
    const user = await User.findById(currentUser._id);
    if (!user) return { success: false, error: "User not found" };

    if (data.name) user.name = data.name.trim();
    if (data.image !== undefined) user.image = data.image;

    await user.save();
    return { success: true };
}

export async function requestPasswordChangeOtp() {
    const currentUser = await getCurrentUser();
    if (!currentUser) return { success: false, error: "Unauthorized" };

    await connectToDatabase();
    const user = await User.findById(currentUser._id);
    if (!user) return { success: false, error: "User not found" };

    const otp = generateOtp();
    user.resetOtp = otp;
    user.resetOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendPasswordResetOtpEmail(user.email, otp);
    return { success: true, email: user.email };
}
