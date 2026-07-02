"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FiLock, FiCheckCircle } from "react-icons/fi";

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token || !email) {
            setError("Invalid reset link. Missing token or email.");
        }
    }, [token, email]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, email, newPassword: password }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => router.push("/login"), 3000);
            } else {
                setError(data.error || "Failed to reset password");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!token || !email) {
        return (
            <div className="glass-card p-10 text-center rounded-[32px] shadow-2xl border border-white/50 bg-white/60 backdrop-blur-xl">
                <h2 className="text-xl font-bold text-[#E53E3E] mb-4">Invalid Link</h2>
                <p className="text-sm text-[#464555] font-medium mb-8">This password reset link is invalid or has expired.</p>
                <Link href="/forgot-password" className="inline-block w-full py-4 rounded-xl font-bold text-white bg-[#3525cd] hover:bg-[#281a9c] transition-all shadow-lg shadow-[#3525cd]/30">
                    Request New Link
                </Link>
            </div>
        );
    }

    return (
        <div className="glass-card p-10 rounded-[32px] shadow-2xl border border-white/50 bg-white/60 backdrop-blur-xl">
            <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-[#3525cd]/10 flex items-center justify-center mx-auto mb-6 text-[#3525cd]">
                    <FiLock size={28} />
                </div>
                <h1 className="text-2xl font-black text-[#111c2d] mb-2">Set New Password</h1>
                <p className="text-sm text-[#464555] font-medium">Must be at least 8 characters with numbers and symbols.</p>
            </div>

            {success ? (
                <div className="text-center p-6 bg-[#006a61]/5 rounded-2xl border border-[#006a61]/10">
                    <FiCheckCircle size={40} className="text-[#006a61] mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-[#111c2d] mb-2">Password Reset Complete</h3>
                    <p className="text-sm text-[#464555] mb-4">You can now log in with your new password.</p>
                    <p className="text-xs text-gray-400 font-medium">Redirecting to login...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {error && (
                        <div className="p-4 rounded-xl bg-[#E53E3E]/10 border border-[#E53E3E]/20 text-[#E53E3E] text-sm font-semibold flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#E53E3E] text-white flex items-center justify-center text-xs shrink-0">!</span>
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            New Password
                        </label>
                        <input
                            type="password"
                            required
                            className="w-full bg-white border border-gray-200 rounded-xl py-3.5 px-4 text-[#111c2d] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3525cd]/30 focus:border-[#3525cd]/50 transition-all placeholder-gray-400"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            required
                            className="w-full bg-white border border-gray-200 rounded-xl py-3.5 px-4 text-[#111c2d] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3525cd]/30 focus:border-[#3525cd]/50 transition-all placeholder-gray-400"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="mt-2 w-full py-4 rounded-xl font-bold text-white bg-[#3525cd] hover:bg-[#281a9c] transition-all shadow-lg shadow-[#3525cd]/30 hover:-translate-y-0.5 hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0 disabled:shadow-none"
                        disabled={loading}
                    >
                        {loading ? <div className="spinner border-t-white w-5 h-5" /> : "Reset Password"}
                    </button>
                </form>
            )}
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background blur effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#3525cd] opacity-10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="fade-in w-full max-w-md relative z-10">
                <Suspense fallback={<div className="spinner-lg spinner border-t-[#3525cd] mx-auto" />}>
                    <ResetPasswordContent />
                </Suspense>
            </div>
        </div>
    );
}
