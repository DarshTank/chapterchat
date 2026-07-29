import { NextResponse } from "next/server";
import { connectToDatabase } from "@/database/mongoose";
import User from "@/database/models/user.model";
import { setSessionCookie } from "@/lib/actions/auth.actions";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
        return NextResponse.redirect(`${origin}/sign-in?error=google_auth_failed`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${origin}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
        return NextResponse.redirect(`${origin}/sign-in?error=google_config_missing`);
    }

    try {
        // 1. Exchange authorization code for tokens
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
            }),
        });

        const tokenData = await tokenResponse.json();
        if (!tokenData.access_token) {
            console.error("Google Token Exchange Failed:", tokenData);
            return NextResponse.redirect(`${origin}/sign-in?error=google_token_failed`);
        }

        // 2. Get user info from Google
        const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        const googleUser = await userResponse.json();
        if (!googleUser.email) {
            return NextResponse.redirect(`${origin}/sign-in?error=google_user_failed`);
        }

        // 3. Find or create user in MongoDB
        await connectToDatabase();
        let user = await User.findOne({ email: googleUser.email.toLowerCase() });

        if (user) {
            if (!user.googleId) user.googleId = googleUser.id;
            if (!user.image) user.image = googleUser.picture;
            user.isVerified = true; // Google accounts are auto-verified
            await user.save();
        } else {
            user = await User.create({
                name: googleUser.name || googleUser.email.split("@")[0],
                email: googleUser.email.toLowerCase(),
                image: googleUser.picture,
                googleId: googleUser.id,
                isVerified: true,
                plan: "free",
            });
        }

        // 4. Set session cookie and redirect to app home page
        await setSessionCookie(user._id.toString());
        return NextResponse.redirect(`${origin}/`);
    } catch (error) {
        console.error("Google OAuth Callback Error:", error);
        return NextResponse.redirect(`${origin}/sign-in?error=google_callback_exception`);
    }
}
