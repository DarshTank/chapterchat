"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { updateUserProfile, requestPasswordChangeOtp, verifyResetOtpAndChangePassword } from "@/lib/actions/auth.actions";
import { User, Mail, ShieldCheck, KeyRound, CheckCircle, Sparkles, Image as ImageIcon, AlertCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function ProfilePage() {
    const { user, loading: authLoading, refreshUser } = useAuth();

    const [name, setName] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [updatingProfile, setUpdatingProfile] = useState(false);
    const [profileMsg, setProfileMsg] = useState("");
    const [profileError, setProfileError] = useState("");

    // Password change states
    const [passwordStep, setPasswordStep] = useState<"idle" | "otp">("idle");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMsg, setPasswordMsg] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [profileImageError, setProfileImageError] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setImageUrl(user.image || "");
            setProfileImageError(false);
        }
    }, [user]);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-(--bg-primary) text-[#212a3b] flex items-center justify-center pt-28">
                <div className="w-8 h-8 border-3 border-[#663820] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-(--bg-primary) text-[#212a3b] flex items-center justify-center pt-28">
                <div className="text-center space-y-4">
                    <p className="text-lg text-stone-600">Please sign in to view your profile.</p>
                    <Link
                        href="/sign-in"
                        className="px-6 py-2.5 bg-[#663820] text-white font-bold rounded-xl shadow-md hover:bg-[#7a4528] transition-all inline-block"
                    >
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileMsg("");
        setProfileError("");
        setUpdatingProfile(true);

        try {
            const res = await updateUserProfile({ name, image: imageUrl });
            if (res.success) {
                setProfileMsg("Profile updated successfully!");
                await refreshUser();
            } else {
                setProfileError(res.error || "Failed to update profile.");
            }
        } catch (err: any) {
            setProfileError(err.message || "An unexpected error occurred.");
        } finally {
            setUpdatingProfile(false);
        }
    };

    const handleRequestPasswordOtp = async () => {
        setPasswordMsg("");
        setPasswordError("");
        setPasswordLoading(true);

        try {
            const res = await requestPasswordChangeOtp();
            if (res.success) {
                setPasswordStep("otp");
                setPasswordMsg("OTP code sent to your registered email address.");
            } else {
                setPasswordError(res.error || "Failed to request OTP code.");
            }
        } catch (err: any) {
            setPasswordError(err.message || "An unexpected error occurred.");
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMsg("");
        setPasswordError("");

        if (newPassword !== confirmPassword) {
            setPasswordError("Passwords do not match.");
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError("Password must be at least 6 characters.");
            return;
        }

        setPasswordLoading(true);

        try {
            const res = await verifyResetOtpAndChangePassword(user.email, otp, newPassword);
            if (res.success) {
                setPasswordMsg("Password changed successfully!");
                setPasswordStep("idle");
                setOtp("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                setPasswordError(res.error || "Failed to change password.");
            }
        } catch (err: any) {
            setPasswordError(err.message || "An unexpected error occurred.");
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="w-full pb-16 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header Card */}
                <div className="bg-white border border-[#e7ded0] rounded-2xl p-6 sm:p-8 shadow-md flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative shrink-0">
                        {user.image && !profileImageError ? (
                            <Image
                                src={user.image}
                                alt={user.name}
                                width={96}
                                height={96}
                                onError={() => setProfileImageError(true)}
                                className="w-24 h-24 rounded-full object-cover border-2 border-[#663820]"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-[#663820] text-white border-2 border-[#663820] flex items-center justify-center text-3xl font-bold font-serif">
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                        )}
                    </div>

                    <div className="space-y-1.5 text-center sm:text-left flex-1">
                        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#212a3b]">{user.name}</h1>
                        <p className="text-sm text-stone-600 flex items-center justify-center sm:justify-start gap-1.5">
                            <Mail size={16} /> {user.email}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Edit Profile Info */}
                    <div className="bg-white border border-[#e7ded0] rounded-2xl p-6 space-y-5 shadow-md">
                        <div className="flex items-center gap-3 border-b border-stone-200 pb-4">
                            <div className="p-2 bg-[#663820]/10 text-[#663820] rounded-lg">
                                <User size={20} />
                            </div>
                            <h2 className="text-lg font-bold font-serif text-[#212a3b]">Personal Information</h2>
                        </div>

                        {profileError && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                                <AlertCircle size={16} /> {profileError}
                            </div>
                        )}

                        {profileMsg && (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                                <CheckCircle size={16} /> {profileMsg}
                            </div>
                        )}

                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white border border-stone-300 rounded-xl text-stone-900 text-sm focus:outline-hidden focus:border-[#663820]"
                                />
                            </div>



                            <button
                                type="submit"
                                disabled={updatingProfile}
                                className="w-full py-2.5 bg-[#663820] hover:bg-[#7a4528] text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                            >
                                {updatingProfile ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    "Save Changes"
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Change Password with OTP */}
                    <div className="bg-white border border-[#e7ded0] rounded-2xl p-6 space-y-5 shadow-md">
                        <div className="flex items-center gap-3 border-b border-stone-200 pb-4">
                            <div className="p-2 bg-[#663820]/10 text-[#663820] rounded-lg">
                                <ShieldCheck size={20} />
                            </div>
                            <h2 className="text-lg font-bold font-serif text-[#212a3b]">Security & Password</h2>
                        </div>

                        {passwordError && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                                <AlertCircle size={16} /> {passwordError}
                            </div>
                        )}

                        {passwordMsg && (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                                <CheckCircle size={16} /> {passwordMsg}
                            </div>
                        )}

                        {passwordStep === "idle" ? (
                            <div className="space-y-4">
                                {!user?.hasPassword ? (
                                    <div className="p-3 bg-[#f8f4e9] border border-[#e7ded0] rounded-xl text-[#212a3b] text-xs space-y-1">
                                        <div className="font-bold flex items-center gap-1.5 text-[#663820]">
                                            <AlertCircle size={14} />
                                            <span>Google OAuth Account (No Password Set)</span>
                                        </div>
                                        <p className="text-stone-600 leading-relaxed">
                                            You registered directly using Gmail. Set a password first to enable direct email/password login.
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-xs text-stone-600 leading-relaxed">
                                        To update your password securely, click below to send a 6-digit verification OTP code to your registered email address.
                                    </p>
                                )}

                                <button
                                    onClick={handleRequestPasswordOtp}
                                    disabled={passwordLoading}
                                    className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
                                >
                                    {passwordLoading ? (
                                        <div className="w-4 h-4 border-2 border-[#663820] border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <KeyRound size={16} className="text-[#663820]" />
                                            <span>{!user?.hasPassword ? "Set Password (Send OTP)" : "Send Password Change OTP"}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleChangePassword} className="space-y-3.5">
                                {!user?.hasPassword && (
                                    <div className="p-2.5 bg-[#f8f4e9] border border-[#e7ded0] rounded-xl text-xs text-[#663820] font-semibold">
                                        Setting Password for Google Account ({user.email})
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                                        6-Digit Security OTP
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        required
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                                        placeholder="123456"
                                        className="w-full text-center tracking-[6px] text-lg font-mono py-2 bg-stone-50 border border-stone-300 rounded-xl text-[#212a3b] focus:outline-hidden focus:border-[#663820]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                                        {!user?.hasPassword ? "Create Password" : "New Password"}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="At least 6 characters"
                                            className="w-full pl-3.5 pr-10 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 text-sm focus:outline-hidden focus:border-[#663820]"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                                            title={showNewPassword ? "Hide password" : "Show password"}
                                        >
                                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm password"
                                            className="w-full pl-3.5 pr-10 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 text-sm focus:outline-hidden focus:border-[#663820]"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                                            title={showConfirmPassword ? "Hide password" : "Show password"}
                                        >
                                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setPasswordStep("idle")}
                                        className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-all border border-stone-300 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={passwordLoading || otp.length !== 6}
                                        className="flex-1 py-2 bg-[#663820] hover:bg-[#7a4528] text-white text-xs font-bold rounded-xl transition-all shadow-md disabled:opacity-50 cursor-pointer"
                                    >
                                        {passwordLoading ? "Saving..." : !user?.hasPassword ? "Set Password & Save" : "Confirm & Save"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
