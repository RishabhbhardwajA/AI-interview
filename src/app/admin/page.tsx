"use client";

import React, { useEffect, useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import { FiUsers, FiActivity, FiSettings, FiCheck, FiGrid, FiEdit2 } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function AdminDashboard() {
    const { user, token } = useAuth();
    const [stats, setStats] = useState({ users: 0, activeInterviews: 0, completedInterviews: 0, systemStatus: "loading" });
    const [usersList, setUsersList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

    useEffect(() => {
        if (token) {
            fetchStats();
            fetchUsers();
        }
    }, [token]);

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/admin/stats", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setStats(data.data.stats);
        } catch (err) {
            console.error("Failed to fetch stats", err);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/admin/users", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setUsersList(data.data.users);
            }
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    };

    const updateUserRole = async (userId: string, newRole: string) => {
        setUpdatingUserId(userId);
        try {
            const res = await fetch(`/api/admin/users/${userId}/role`, {
                method: "PATCH",
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ role: newRole })
            });
            const data = await res.json();
            if (data.success) {
                setUsersList(usersList.map(u => u._id === userId ? { ...u, role: newRole } : u));
            } else {
                alert(data.error || "Failed to update role");
            }
        } catch (err) {
            console.error("Error updating role", err);
            alert("Error updating role");
        } finally {
            setUpdatingUserId(null);
        }
    };

    const Sidebar = () => (
        <aside className="hidden md:flex flex-col h-full py-8 w-64 fixed left-0 top-[72px] glass-panel shadow-xl z-30">
            <div className="px-6 mb-8 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-xl font-bold bg-[#E53E3E] text-white">
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

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <div className="glass-card rounded-[24px] p-5 neomorphic-hover cursor-default">
                                <div className="flex items-center gap-3 mb-2">
                                    <FiUsers className="text-[#4285F4]" size={20} />
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Users</p>
                                </div>
                                <p className="text-3xl font-black text-[#111c2d]">{stats.users}</p>
                            </div>
                            
                            <div className="glass-card rounded-[24px] p-5 neomorphic-hover cursor-default">
                                <div className="flex items-center gap-3 mb-2">
                                    <FiActivity className="text-[#F5A623]" size={20} />
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Interviews</p>
                                </div>
                                <p className="text-3xl font-black text-[#111c2d]">{stats.activeInterviews}</p>
                            </div>

                            <div className="glass-card rounded-[24px] p-5 neomorphic-hover cursor-default">
                                <div className="flex items-center gap-3 mb-2">
                                    <FiCheck className="text-[#006a61]" size={20} />
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Completed Interviews</p>
                                </div>
                                <p className="text-3xl font-black text-[#111c2d]">{stats.completedInterviews}</p>
                            </div>

                            <div className="glass-card rounded-[24px] p-5 neomorphic-hover cursor-default">
                                <div className="flex items-center gap-3 mb-2">
                                    <FiSettings className="text-[#6C5CE7]" size={20} />
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">System</p>
                                </div>
                                <p className="text-xl font-black text-[#111c2d] mt-2">{stats.systemStatus}</p>
                            </div>
                        </div>

                        <div className="glass-card rounded-[24px] p-8 overflow-hidden">
                            <h2 className="text-xl font-bold text-[#111c2d] mb-6 flex items-center gap-2">
                                <FiUsers className="text-[#E53E3E]" /> User Management
                            </h2>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Name</th>
                                            <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Email</th>
                                            <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                                            <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Joined</th>
                                            <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan={5} className="py-8 text-center text-gray-500">Loading users...</td></tr>
                                        ) : usersList.length === 0 ? (
                                            <tr><td colSpan={5} className="py-8 text-center text-gray-500">No users found.</td></tr>
                                        ) : (
                                            usersList.map(u => (
                                                <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                    <td className="py-3 px-4 font-bold text-[#111c2d]">{u.name}</td>
                                                    <td className="py-3 px-4 text-sm text-gray-500">{u.email}</td>
                                                    <td className="py-3 px-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                            u.role === "Administrator" ? "bg-red-100 text-red-700" :
                                                            u.role === "Mentor" ? "bg-purple-100 text-purple-700" :
                                                            "bg-blue-100 text-blue-700"
                                                        }`}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-500">
                                                        {new Date(u.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <select 
                                                            disabled={updatingUserId === u._id}
                                                            value={u.role}
                                                            onChange={(e) => updateUserRole(u._id, e.target.value)}
                                                            className="text-xs font-bold bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#E53E3E] disabled:opacity-50 cursor-pointer"
                                                        >
                                                            <option value="Student">Student</option>
                                                            <option value="Mentor">Mentor</option>
                                                            <option value="Administrator">Administrator</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </RoleGuard>
    );
}
