"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FiMail, FiArrowLeft, FiCheckCircle } from "react-icons/fi";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(true);
            } else {
                setError(data.error || "Something went wrong.");
            }
        } catch (err) {
            setError("Failed to process request. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background blur effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#3525cd] opacity-10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="fade-in w-full max-w-md relative z-10">
                <Link href="/login" className="inline-flex items-center gap-2 text-[#464555] hover:text-[#3525cd] text-sm font-bold mb-6 transition-colors">
                    <FiArrowLeft size={16} /> Back to Login
                </Link>

                <div className="glass-card p-10 rounded-[32px] shadow-2xl border border-white/50 bg-white/60 backdrop-blur-xl">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-[#3525cd]/10 flex items-center justify-center mx-auto mb-6 text-[#3525cd]">
                            <FiMail size={28} />
                        </div>
                        <h1 className="text-2xl font-black text-[#111c2d] mb-2">Forgot Password?</h1>
                        <p className="text-sm text-[#464555] font-medium">No worries, we'll send you reset instructions.</p>
                    </div>

                    {success ? (
                        <div className="text-center p-6 bg-[#006a61]/5 rounded-2xl border border-[#006a61]/10">
                            <FiCheckCircle size={40} className="text-[#006a61] mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-[#111c2d] mb-2">Check your email</h3>
                            <p className="text-sm text-[#464555] mb-4">We sent a password reset link to <br/><strong className="text-[#111c2d]">{email}</strong></p>
                            <p className="text-xs text-gray-400 font-medium">Note: If you don't see it, check your spam folder. In this demo, the link is printed to the server console.</p>
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
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-white border border-gray-200 rounded-xl py-3.5 px-4 text-[#111c2d] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3525cd]/30 focus:border-[#3525cd]/50 transition-all placeholder-gray-400"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
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
            </div>
        </div>
    );
}
