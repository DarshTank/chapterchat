"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyEmailOtp, resendVerificationOtp } from "@/lib/actions/auth.actions";
import { useAuth } from "@/components/providers/AuthProvider";
import { KeyRound, CheckCircle, RefreshCw, AlertCircle } from "lucide-react";

function VerifyOtpForm() {
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "";
    const router = useRouter();
    const { refreshUser } = useAuth();

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [timer, setTimer] = useState(60);

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer((t) => t - 1), 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!email) {
            setError("Email missing. Please sign up or sign in again.");
            return;
        }

        if (otp.length !== 6) {
            setError("Please enter a valid 6-digit OTP code.");
            return;
        }

        setLoading(true);
        try {
            const res = await verifyEmailOtp(email, otp);
            if (res.success) {
                await refreshUser();
                router.push("/");
                router.refresh();
            } else {
                setError(res.error || "Verification failed.");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (timer > 0 || resending) return;
        setError("");
        setMessage("");
        setResending(true);

        try {
            const res = await resendVerificationOtp(email);
            if (res.success) {
                setMessage("A new 6-digit code has been sent to your email.");
                setTimer(60);
            } else {
                setError(res.error || "Failed to resend verification code.");
            }
        } catch (err: any) {
            setError(err.message || "An error occurred while resending.");
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-white border border-[#e7ded0] rounded-2xl shadow-lg p-8 space-y-6">
            <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-[#663820]/10 border border-[#663820]/20 rounded-xl flex items-center justify-center mx-auto text-[#663820]">
                    <KeyRound size={24} />
                </div>
                <h1 className="text-2xl font-bold font-serif tracking-tight text-[#212a3b]">Verify Your Account</h1>
                <p className="text-sm text-stone-600">
                    Enter the 6-digit verification code sent to <br />
                    <span className="font-semibold text-[#663820]">{email || "your email"}</span>
                </p>
            </div>

            {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-sm">
                    <AlertCircle size={18} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {message && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm">
                    <CheckCircle size={18} className="shrink-0" />
                    <span>{message}</span>
                </div>
            )}

            <form onSubmit={handleVerify} className="space-y-5">
                <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2 text-center">
                        6-Digit Security Code
                    </label>
                    <input
                        type="text"
                        maxLength={6}
                        required
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="123456"
                        className="w-full text-center tracking-[12px] text-2xl font-mono py-3.5 bg-stone-50 border border-stone-300 rounded-xl text-[#212a3b] placeholder:text-stone-300 focus:outline-hidden focus:border-[#663820]"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="w-full py-3 bg-[#663820] hover:bg-[#7a4528] text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            <CheckCircle size={18} />
                            Verify & Continue
                        </>
                    )}
                </button>
            </form>

            <div className="text-center pt-2">
                <button
                    onClick={handleResend}
                    disabled={timer > 0 || resending}
                    className="text-xs text-stone-500 hover:text-[#663820] transition-colors disabled:opacity-50 inline-flex items-center gap-1.5 font-medium"
                >
                    <RefreshCw size={14} className={resending ? "animate-spin" : ""} />
                    {timer > 0 ? `Resend code in ${timer}s` : "Resend Code"}
                </button>
            </div>
        </div>
    );
}

export default function VerifyOtpPage() {
    return (
        <div className="w-full flex items-center justify-center p-4 py-8">
            <Suspense fallback={<div className="text-stone-500">Loading...</div>}>
                <VerifyOtpForm />
            </Suspense>
        </div>
    );
}
