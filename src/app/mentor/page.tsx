"use client";

import React from "react";
import RoleGuard from "@/components/RoleGuard";
import { FiBookOpen, FiUserCheck, FiGrid, FiSettings } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function MentorDashboard() {
    const { user } = useAuth();

    const Sidebar = () => (
        <aside className="hidden md:flex flex-col h-full py-8 w-64 fixed left-0 top-[72px] glass-panel shadow-xl z-30">
            <div className="px-6 mb-8 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-xl font-bold bg-[#6C5CE7] text-white">
                    {user?.name?.charAt(0).toUpperCase() || "M"}
                </div>
                <div>
                    <p className="text-sm font-semibold truncate w-32">{user?.name || "Mentor"}</p>
                    <p className="text-xs text-[#6C5CE7] font-bold tracking-wider uppercase">Mentor</p>
                </div>
            </div>
            <nav className="flex-1 overflow-y-auto px-4 flex flex-col gap-1">
                <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-[#464555] hover:text-[#3525cd] hover:bg-[#3525cd]/5 transition-all duration-300 rounded-lg group">
                    <FiGrid size={18} />
                    <span className="text-sm">User Dashboard</span>
                </Link>
                <div className="flex items-center gap-3 px-4 py-3 text-[#6C5CE7] font-bold border-l-4 border-[#6C5CE7] bg-[#6C5CE7]/5 rounded-r-lg group mt-4">
                    <FiBookOpen size={18} />
                    <span className="text-sm">Mentor Portal</span>
                </div>
            </nav>
        </aside>
    );

    return (
        <RoleGuard allowedRoles={["Mentor", "Administrator"]}>
            <div className="flex h-screen overflow-hidden bg-[#F8FAFC] text-[#111c2d]">
                <Sidebar />
                <main className="flex-1 ml-0 md:ml-64 h-full overflow-y-auto w-full pt-[72px] px-4 md:px-8 py-8">
                    <div className="fade-in max-w-[1000px] mx-auto mt-4">
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8 glass-card p-6 rounded-[24px]">
                            <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-[#6C5CE7] to-[#A29BFE] shadow-lg shadow-[#6C5CE7]/30 flex items-center justify-center shrink-0">
                                <FiBookOpen size={28} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-2 text-[#111c2d]">Mentor Dashboard</h1>
                                <p className="text-sm text-gray-500 font-medium">Review student performance and provide feedback.</p>
                            </div>
                        </div>

                        <div className="glass-card rounded-[24px] p-8 neomorphic-hover cursor-default">
                            <h2 className="text-xl font-bold text-[#111c2d] mb-6 flex items-center gap-2">
                                <FiUserCheck className="text-[#6C5CE7]" /> Students Pending Review
                            </h2>
                            
                            <div className="flex flex-col gap-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="p-5 bg-white/60 border border-gray-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-[#6C5CE7]/10 flex items-center justify-center text-[#6C5CE7] font-bold">
                                                {i}
                                            </div>
                                            <div>
                                                <p className="font-bold text-[#111c2d]">Student Mock {i}</p>
                                                <p className="text-xs text-gray-500 font-medium mt-1">Frontend Developer Interview</p>
                                            </div>
                                        </div>
                                        <button className="px-5 py-2.5 rounded-xl font-bold text-sm bg-white border border-gray-200 text-[#464555] hover:bg-gray-50 transition-colors shadow-sm">
                                            Review Interview
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </RoleGuard>
    );
}
