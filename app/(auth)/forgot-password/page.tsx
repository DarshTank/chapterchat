"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset, verifyResetOtpAndChangePassword } from "@/lib/actions/auth.actions";
import { KeyRound, Mail, Lock, CheckCircle, ArrowLeft, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function ForgotPasswordPage() {
    const [step, setStep] = useState<"request" | "reset">("request");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await requestPasswordReset(email);
            if (res.success) {
                setStep("reset");
            } else {
                setError(res.error || "Failed to request password reset code.");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        setLoading(true);

        try {
            const res = await verifyResetOtpAndChangePassword(email, otp, newPassword);
            if (res.success) {
                setSuccess(true);
            } else {
                setError(res.error || "Failed to reset password.");
            }
        } catch (err: any) {
            setError(err.message || "An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full flex items-center justify-center p-4 py-8">
            <div className="w-full max-w-md bg-white border border-[#e7ded0] rounded-2xl shadow-lg p-8 space-y-6">
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-[#663820]/10 border border-[#663820]/20 rounded-xl flex items-center justify-center mx-auto text-[#663820]">
                        <KeyRound size={24} />
                    </div>
                    <h1 className="text-2xl font-bold font-serif tracking-tight text-[#212a3b]">
                        {success ? "Password Reset Complete" : step === "request" ? "Forgot Password" : "Reset Password"}
                    </h1>
                    <p className="text-sm text-stone-600">
                        {success
                            ? "Your password has been successfully reset."
                            : step === "request"
                            ? "Enter your account email to receive a password reset OTP"
                            : `Enter the OTP sent to ${email}`}
                    </p>
                </div>

                {error && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-sm">
                        <AlertCircle size={18} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {success ? (
                    <div className="space-y-6 text-center">
                        <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-700">
                            <CheckCircle size={36} />
                        </div>
                        <p className="text-sm text-stone-700">You can now sign in with your new password.</p>
                        <Link
                            href="/sign-in"
                            className="w-full py-3 bg-[#663820] hover:bg-[#7a4528] text-white font-bold rounded-xl transition-all shadow-md inline-block"
                        >
                            Back to Sign In
                        </Link>
                    </div>
                ) : step === "request" ? (
                    <form onSubmit={handleRequestOtp} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                                Account Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-3 text-stone-400" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-300 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:border-[#663820] text-sm"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-[#663820] hover:bg-[#7a4528] text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                "Send Reset OTP"
                            )}
                        </button>

                        <div className="text-center pt-2">
                            <Link href="/sign-in" className="text-xs text-stone-500 hover:text-[#663820] font-medium inline-flex items-center gap-1">
                                <ArrowLeft size={14} /> Back to Sign In
                            </Link>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                                6-Digit OTP Code
                            </label>
                            <input
                                type="text"
                                maxLength={6}
                                required
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                                placeholder="123456"
                                className="w-full text-center tracking-[8px] text-xl font-mono py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-[#212a3b] placeholder:text-stone-300 focus:outline-hidden focus:border-[#663820]"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                                New Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-3 text-stone-400" size={18} />
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="At least 6 characters"
                                    className="w-full pl-10 pr-11 py-2.5 bg-white border border-stone-300 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:border-[#663820] text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-700 cursor-pointer"
                                    title={showNewPassword ? "Hide password" : "Show password"}
                                >
                                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-3 text-stone-400" size={18} />
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter new password"
                                    className="w-full pl-10 pr-11 py-2.5 bg-white border border-stone-300 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:border-[#663820] text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-700 cursor-pointer"
                                    title={showConfirmPassword ? "Hide password" : "Show password"}
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otp.length !== 6}
                            className="w-full py-3 bg-[#663820] hover:bg-[#7a4528] text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                "Update Password"
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
