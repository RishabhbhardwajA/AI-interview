"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("Verifying your email...");

    useEffect(() => {
        if (!token || !email) {
            setStatus("error");
            setMessage("Invalid verification link. Missing token or email.");
            return;
        }

        const verify = async () => {
            try {
                const res = await fetch("/api/auth/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token, email }),
                });
                
                const data = await res.json();
                
                if (res.ok) {
                    setStatus("success");
                    setMessage("Your email has been successfully verified! You can now access all features.");
                    setTimeout(() => {
                        router.push("/dashboard");
                    }, 3000);
                } else {
                    setStatus("error");
                    setMessage(data.error || "Verification failed. The link may have expired.");
                }
            } catch (err) {
                setStatus("error");
                setMessage("An error occurred during verification. Please try again.");
            }
        };

        verify();
    }, [token, email, router]);

    return (
        <div className="fade-in w-full max-w-md relative z-10 text-center">
            <div className="glass-card p-10 rounded-[32px] shadow-2xl border border-white/50 bg-white/60 backdrop-blur-xl">
                {status === "loading" && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="spinner-lg spinner border-t-[#3525cd] mb-4" />
                        <h2 className="text-xl font-black text-[#111c2d]">Verifying Email</h2>
                        <p className="text-sm text-[#464555] font-medium">{message}</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="flex flex-col items-center gap-4">
                        <FiCheckCircle size={64} className="text-[#006a61] mb-2" />
                        <h2 className="text-xl font-black text-[#111c2d]">Email Verified!</h2>
                        <p className="text-sm text-[#464555] font-medium">{message}</p>
                        <p className="text-xs text-gray-400 font-bold mt-2">Redirecting to dashboard...</p>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center gap-4">
                        <FiXCircle size={64} className="text-[#E53E3E] mb-2" />
                        <h2 className="text-xl font-black text-[#111c2d]">Verification Failed</h2>
                        <p className="text-sm text-[#E53E3E] font-bold">{message}</p>
                        <Link href="/login" className="mt-6 w-full py-4 rounded-xl font-bold text-white bg-[#3525cd] hover:bg-[#281a9c] transition-all shadow-lg shadow-[#3525cd]/30 inline-block">
                            Go to Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background blur effects */}
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#006a61] opacity-10 rounded-full blur-[100px] pointer-events-none"></div>

            <Suspense fallback={<div className="spinner-lg spinner border-t-[#3525cd] relative z-10" />}>
                <VerifyEmailContent />
            </Suspense>
        </div>
    );
}
