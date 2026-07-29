"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginUser } from "@/lib/actions/auth.actions";
import { useAuth } from "@/components/providers/AuthProvider";
import TransparentLogo from "@/components/TransparentLogo";
import { Mail, Lock, LogIn, AlertCircle } from "lucide-react";

export default function SignInPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const { refreshUser } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await loginUser({ email, password });
            if (res.success) {
                await refreshUser();
                router.push("/");
                router.refresh();
            } else if (res.requiresVerification && res.email) {
                router.push(`/verify-otp?email=${encodeURIComponent(res.email)}`);
            } else {
                setError(res.error || "Failed to sign in.");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full flex items-center justify-center p-4 py-8">
            <div className="w-full max-w-md bg-white border border-[#e7ded0] rounded-2xl shadow-lg p-8 space-y-6">
                <div className="text-center space-y-2">
                    <div className="flex justify-center mb-1">
                        <TransparentLogo size="lg" />
                    </div>
                    <h1 className="text-2xl font-bold font-serif tracking-tight text-[#212a3b]">Welcome Back</h1>
                    <p className="text-sm text-stone-600">Sign in to continue talking with your library</p>
                </div>

                {error && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-sm">
                        <AlertCircle size={18} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <a
                    href="/api/auth/google"
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 font-medium rounded-xl transition-all shadow-xs"
                >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                    </svg>
                    <span>Continue with Google</span>
                </a>

                {/* Centered Divider */}
                <div className="relative flex items-center justify-center my-5">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-stone-200" />
                    </div>
                    <div className="relative bg-white px-3 text-xs text-stone-400 font-semibold uppercase tracking-wider">
                        or sign in with email
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                            Email Address
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

                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                                Password
                            </label>
                            <Link href="/forgot-password" className="text-xs text-[#663820] font-semibold hover:underline">
                                Forgot password?
                            </Link>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-3 text-stone-400" size={18} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
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
                            <>
                                <LogIn size={18} />
                                Sign In
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center text-sm text-stone-600">
                    Don&apos;t have an account?{" "}
                    <Link href="/sign-up" className="text-[#663820] font-bold hover:underline">
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
}
