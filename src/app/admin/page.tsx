"use client";

import React, { useEffect, useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import { FiUsers, FiActivity, FiSettings, FiCheck, FiGrid, FiTarget, FiPlay, FiFileText, FiBriefcase, FiAward } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function AdminDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ users: 0, activeInterviews: 0, systemStatus: "loading" });

    useEffect(() => {
        // Mock data fetch for Admin Dashboard
        setTimeout(() => {
            setStats({ users: 142, activeInterviews: 28, systemStatus: "Online" });
        }, 1000);
    }, []);

    const Sidebar = () => (
        <aside className="hidden md:flex flex-col h-full py-8 w-64 fixed left-0 top-[72px] glass-panel shadow-xl z-30">
            <div className="px-6 mb-8 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-xl font-bold bg-[#4f46e5] text-white">
                    {user?.name?.charAt(0).toUpperCase() || "A"}
                </div>
                <div>
                    <p className="text-sm font-semibold truncate w-32">{user?.name || "Admin"}</p>
                    <p className="text-xs text-[#E53E3E] font-bold tracking-wider uppercase">Administrator</p>
                </div>
            </div>
            <nav className="flex-1 overflow-y-auto px-4 flex flex-col gap-1">
                <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-[#464555] hover:text-[#3525cd] hover:bg-[#3525cd]/5 transition-all duration-300 rounded-lg group">
                    <FiGrid size={18} />
                    <span className="text-sm">User Dashboard</span>
                </Link>
                <div className="flex items-center gap-3 px-4 py-3 text-[#E53E3E] font-bold border-l-4 border-[#E53E3E] bg-[#E53E3E]/5 rounded-r-lg group mt-4">
                    <FiSettings size={18} />
                    <span className="text-sm">Admin Portal</span>
                </div>
            </nav>
        </aside>
    );

    return (
        <RoleGuard allowedRoles={["Administrator"]}>
            <div className="flex h-screen overflow-hidden bg-[#F8FAFC] text-[#111c2d]">
                <Sidebar />
                <main className="flex-1 ml-0 md:ml-64 h-full overflow-y-auto w-full pt-[72px] px-4 md:px-8 py-8">
                    <div className="fade-in max-w-[1000px] mx-auto mt-4">
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8 glass-card p-6 rounded-[24px]">
                            <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-[#E53E3E] to-[#FF6B4A] shadow-lg shadow-[#E53E3E]/30 flex items-center justify-center shrink-0">
                                <FiSettings size={28} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-2 text-[#111c2d]">Administrator Portal</h1>
                                <p className="text-sm text-gray-500 font-medium">Manage platform settings, users, and global activity.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="glass-card rounded-[24px] p-6 neomorphic-hover cursor-default">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-[#4285F4]/10 text-[#4285F4] flex items-center justify-center">
                                        <FiUsers size={24} />
                                    </div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Users</p>
                                </div>
                                <p className="text-4xl font-black text-[#111c2d]">{stats.users || "--"}</p>
                            </div>
                            
                            <div className="glass-card rounded-[24px] p-6 neomorphic-hover cursor-default">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-[#F5A623]/10 text-[#F5A623] flex items-center justify-center">
                                        <FiActivity size={24} />
                                    </div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Interviews</p>
                                </div>
                                <p className="text-4xl font-black text-[#111c2d]">{stats.activeInterviews || "--"}</p>
                            </div>

                            <div className="glass-card rounded-[24px] p-6 neomorphic-hover cursor-default">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-[#006a61]/10 text-[#006a61] flex items-center justify-center">
                                        <FiCheck size={24} />
                                    </div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">System Status</p>
                                </div>
                                <p className="text-3xl font-black text-[#111c2d]">{stats.systemStatus === "loading" ? "--" : stats.systemStatus}</p>
                            </div>
                        </div>

                        <div className="glass-card rounded-[24px] p-10 text-center border-dashed border-2 border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center min-h-[300px]">
                            <FiSettings size={48} className="text-gray-300 mb-4" />
                            <h3 className="text-xl font-bold text-[#111c2d] mb-2">Admin Management Interface</h3>
                            <p className="text-sm text-gray-500 font-medium max-w-md">
                                This dashboard is only visible to users with the Administrator role. Features will be implemented in a future update.
                            </p>
                        </div>

                    </div>
                </main>
            </div>
        </RoleGuard>
    );
}
