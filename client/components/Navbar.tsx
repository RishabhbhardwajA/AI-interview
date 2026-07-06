"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { FiMenu, FiX, FiLogOut, FiUser, FiGrid, FiPlay, FiBriefcase, FiAward, FiShield, FiBookOpen, FiSettings } from "react-icons/fi";

export default function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <nav
            className="fixed top-0 left-0 right-0 h-[72px] bg-white/70 backdrop-blur-xl border-b border-gray-100 z-50 flex items-center justify-between px-6 md:px-8 transition-all duration-300"
        >
            {/* Logo */}
            <Link
                href="/"
                className="flex items-center gap-3 group"
            >
                <img 
                    src="/logo.png" 
                    alt="InterviewAI Logo" 
                    className="w-10 h-10 object-contain group-hover:scale-105 transition-transform drop-shadow-md rounded-xl"
                />
                <span className="text-xl font-black text-[#111c2d] tracking-tight">
                    InterviewAI
                </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-2">
                {isAuthenticated ? (
                    <>
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[#464555] hover:text-[#3525cd] hover:bg-[#3525cd]/5 transition-all text-sm font-semibold"
                        >
                            <FiGrid size={16} /> Dashboard
                        </Link>
                        
                        {(user?.role === "Administrator" || user?.role === "Mentor") && (
                            <Link
                                href="/mentor"
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[#464555] hover:text-[#6C5CE7] hover:bg-[#6C5CE7]/5 transition-all text-sm font-semibold"
                            >
                                <FiBookOpen size={16} /> Mentor
                            </Link>
                        )}

                        {user?.role === "Administrator" && (
                            <Link
                                href="/admin"
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[#464555] hover:text-[#E53E3E] hover:bg-[#E53E3E]/5 transition-all text-sm font-semibold"
                            >
                                <FiShield size={16} /> Admin
                            </Link>
                        )}
                        
                        <div className="w-[1px] h-6 bg-gray-200 mx-2" />
                        
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3525cd]/5 text-[#3525cd] font-semibold text-sm">
                            <FiUser size={16} />
                            <span>{user?.name}</span>
                        </div>

                        <Link href="/settings" className="p-2 rounded-xl text-[#464555] hover:text-[#3525cd] hover:bg-[#3525cd]/5 transition-all" title="Settings">
                            <FiSettings size={18} />
                        </Link>
                        
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[#E53E3E] hover:bg-[#E53E3E]/10 transition-all text-sm font-semibold"
                        >
                            <FiLogOut size={16} /> Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link href="/login" className="px-6 py-2.5 rounded-xl text-[#464555] font-bold hover:bg-gray-50 transition-colors text-sm">
                            Log In
                        </Link>
                        <Link href="/signup" className="px-6 py-2.5 rounded-xl font-bold text-white bg-[#3525cd] hover:bg-[#281a9c] transition-all shadow-md shadow-[#3525cd]/20 text-sm">
                            Sign Up
                        </Link>
                    </>
                )}
            </div>

            {/* Mobile hamburger */}
            <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden text-[#111c2d] p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
                {mobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="md:hidden absolute top-[72px] left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-100 p-4 flex flex-col gap-2 shadow-lg">
                    {isAuthenticated ? (
                        <>
                            <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="p-3 text-[#111c2d] font-bold rounded-xl hover:bg-gray-50">
                                Dashboard
                            </Link>
                            <Link href="/interview" onClick={() => setMobileOpen(false)} className="p-3 text-[#111c2d] font-bold rounded-xl hover:bg-gray-50">
                                Start Interview
                            </Link>
                            <Link href="/recruiter" onClick={() => setMobileOpen(false)} className="p-3 text-[#111c2d] font-bold rounded-xl hover:bg-gray-50">
                                Recruiter Simulator
                            </Link>
                            <Link href="/arena" onClick={() => setMobileOpen(false)} className="p-3 text-[#111c2d] font-bold rounded-xl hover:bg-gray-50">
                                Peer Challenge Arena
                            </Link>
                            {(user?.role === "Administrator" || user?.role === "Mentor") && (
                                <Link href="/mentor" onClick={() => setMobileOpen(false)} className="p-3 text-[#6C5CE7] font-bold rounded-xl hover:bg-[#6C5CE7]/5">
                                    Mentor Dashboard
                                </Link>
                            )}
                            {user?.role === "Administrator" && (
                                <Link href="/admin" onClick={() => setMobileOpen(false)} className="p-3 text-[#E53E3E] font-bold rounded-xl hover:bg-[#E53E3E]/5">
                                    Administrator Portal
                                </Link>
                            )}
                            <button
                                onClick={() => { logout(); setMobileOpen(false); }}
                                className="p-3 text-[#E53E3E] font-bold rounded-xl hover:bg-[#E53E3E]/5 text-left"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" onClick={() => setMobileOpen(false)} className="p-3 text-[#111c2d] font-bold text-center rounded-xl hover:bg-gray-50">
                                Log In
                            </Link>
                            <Link href="/signup" onClick={() => setMobileOpen(false)} className="p-3 text-white font-bold text-center bg-[#3525cd] rounded-xl">
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
}
