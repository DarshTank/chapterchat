import { model, Schema, models } from "mongoose";
import { IUser } from "@/types";
import crypto from "node:crypto";

function isPasswordHashed(password: string): boolean {
    if (!password) return false;
    if (password.startsWith("$2a$") || password.startsWith("$2b$") || password.startsWith("$2y$")) {
        return true;
    }
    const parts = password.split(":");
    return parts.length === 2 && parts[0].length === 32 && parts[1].length === 128;
}

function hashPasswordSync(password: string): string {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return `${salt}:${hash}`;
}

const UserSchema = new Schema<IUser>({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String }, // Optional for Google OAuth users
    image: { type: String },
    googleId: { type: String },
    isVerified: { type: Boolean, default: false },
    verificationOtp: { type: String },
    verificationOtpExpiresAt: { type: Date },
    resetOtp: { type: String },
    resetOtpExpiresAt: { type: Date },
    plan: { type: String, default: 'free' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isBlocked: { type: Boolean, default: false },
    blockedReason: { type: String },
}, { timestamps: true });

UserSchema.pre("save", function () {
    if (this.isModified("password") && this.password && !isPasswordHashed(this.password)) {
        this.password = hashPasswordSync(this.password);
    }
});

const User = models.User || model<IUser>('User', UserSchema);

export default User;

