"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiMail, FiLock, FiArrowRight } from "react-icons/fi";
import { GoogleLogin } from "@react-oauth/google";

export default function LoginPage() {
    const { login, googleLogin, isAuthenticated } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    if (isAuthenticated) {
        router.push("/dashboard");
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login(email, password);
            router.push("/dashboard");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden pt-20">
            {/* Background blur effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#3525cd] opacity-10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#006a61] opacity-10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="glass-card fade-in w-full max-w-md p-10 md:p-12 relative z-10 rounded-[32px] shadow-2xl border border-white/50 bg-white/60 backdrop-blur-xl">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-sm mb-6 border border-gray-100 text-3xl">
                        👋
                    </div>
                    <h1 className="text-3xl font-black mb-2 text-[#111c2d]">Welcome Back</h1>
                    <p className="text-[#464555] text-sm font-medium">Sign in to continue practicing</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-[#E53E3E]/10 border border-[#E53E3E]/20 text-[#E53E3E] text-sm font-semibold flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#E53E3E] text-white flex items-center justify-center text-xs shrink-0">!</span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                        <div className="relative group">
                            <FiMail size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#3525cd] transition-colors" />
                            <input 
                                type="email" 
                                className="w-full bg-white border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 text-[#111c2d] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3525cd]/30 focus:border-[#3525cd]/50 transition-all placeholder-gray-400" 
                                placeholder="you@example.com" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Password</label>
                            <Link href="/forgot-password" className="text-xs font-bold text-[#3525cd] hover:underline">Forgot?</Link>
                        </div>
                        <div className="relative group">
                            <FiLock size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#3525cd] transition-colors" />
                            <input 
                                type="password" 
                                className="w-full bg-white border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 text-[#111c2d] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3525cd]/30 focus:border-[#3525cd]/50 transition-all placeholder-gray-400" 
                                placeholder="••••••••" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="mt-2 w-full py-4 rounded-xl font-bold text-white bg-[#3525cd] hover:bg-[#281a9c] transition-all shadow-lg shadow-[#3525cd]/30 hover:-translate-y-0.5 hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0 disabled:shadow-none"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="spinner border-t-white w-5 h-5" />
                        ) : (
                            <>Sign In <FiArrowRight size={18} /></>
                        )}
                    </button>
                </form>

                <div className="my-8 flex items-center gap-4">
                    <div className="h-px bg-gray-200 flex-1"></div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Or continue with</span>
                    <div className="h-px bg-gray-200 flex-1"></div>
                </div>

                <div className="flex justify-center w-full [&>div]:w-full [&>div>div]:!w-full [&_iframe]:!w-full">
                    <GoogleLogin
                        onSuccess={async (credentialResponse) => {
                            if (credentialResponse.credential) {
                                try {
                                    setLoading(true);
                                    await googleLogin(credentialResponse.credential);
                                    router.push("/dashboard");
                                } catch (err: any) {
                                    setError(err.message || "Google login failed");
                                    setLoading(false);
                                }
                            }
                        }}
                        onError={() => {
                            setError("Google login failed");
                        }}
                        useOneTap
                        theme="outline"
                        size="large"
                        text="continue_with"
                        shape="pill"
                    />
                </div>

                <p className="text-center mt-8 text-sm font-medium text-[#464555]">
                    Don't have an account?{" "}
                    <Link href="/signup" className="text-[#3525cd] font-bold hover:underline">Sign Up</Link>
                </p>
            </div>
        </div>
    );
}
