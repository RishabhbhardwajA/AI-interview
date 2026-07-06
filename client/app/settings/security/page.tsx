"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiShield, FiSmartphone, FiMonitor, FiClock, FiAlertTriangle, FiXCircle, FiCheck, FiArrowLeft, FiGrid, FiTarget, FiPlay, FiFileText, FiBriefcase, FiAward, FiSettings } from "react-icons/fi";

interface SessionData {
    id: string;
    deviceInfo: string;
    ipAddress: string;
    lastActive: string;
    isCurrent: boolean;
}

interface SecurityLogData {
    _id: string;
    event: string;
    deviceInfo: string;
    ipAddress: string;
    details?: string;
    createdAt: string;
}

export default function SecurityDashboard() {
    const { user, token, isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();

    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [logs, setLogs] = useState<SecurityLogData[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!token) return;
        try {
            const [sessRes, logRes] = await Promise.all([
                fetch("/api/auth/sessions", { headers: { Authorization: `Bearer ${token}` } }),
                fetch("/api/auth/security-logs", { headers: { Authorization: `Bearer ${token}` } }),
            ]);

            const sessData = await sessRes.json();
            const logData = await logRes.json();

            if (sessRes.ok) setSessions(sessData.sessions || []);
            if (logRes.ok) setLogs(logData.logs || []);
        } catch (err) {
            console.error("Failed to fetch security data", err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login");
        } else if (token) {
            fetchData();
        }
    }, [authLoading, isAuthenticated, token, router, fetchData]);

    const revokeSession = async (sessionId: string) => {
        if (!confirm("Are you sure you want to log out of this device?")) return;
        try {
            const res = await fetch("/api/auth/sessions", {
                method: "DELETE",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ sessionId })
            });
            if (res.ok) {
                setSessions(prev => prev.filter(s => s.id !== sessionId));
            }
        } catch (err) {
            console.error("Failed to revoke session", err);
            alert("Failed to revoke session. Try again.");
        }
    };

    if (authLoading || loading) {
        return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center"><div className="spinner-lg spinner border-t-[#3525cd]" /></div>;
    }

    const getDeviceIcon = (info: string) => {
        const lower = info.toLowerCase();
        if (lower.includes("mobile") || lower.includes("iphone") || lower.includes("android")) return <FiSmartphone size={24} />;
        return <FiMonitor size={24} />;
    };

    const formatEventName = (event: string) => {
        return event.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    const getEventIcon = (event: string) => {
        if (event.includes("failed") || event.includes("locked") || event.includes("suspicious")) return <FiAlertTriangle className="text-[#E53E3E]" />;
        return <FiCheck className="text-[#006a61]" />;
    };

    const Sidebar = () => (
        <aside className="hidden md:flex flex-col h-full py-8 w-64 fixed left-0 top-[72px] glass-panel shadow-xl z-30">
            <div className="px-6 mb-8 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-xl font-bold bg-[#4f46e5] text-white">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                    <p className="text-sm font-semibold truncate w-32">{user?.name}</p>
                    <p className="text-xs text-[#464555] truncate w-32">{user?.email}</p>
                </div>
            </div>
            <nav className="flex-1 overflow-y-auto px-4 flex flex-col gap-1">
                <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-[#464555] hover:text-[#3525cd] hover:bg-[#3525cd]/5 transition-all duration-300 rounded-lg group">
                    <FiGrid size={18} />
                    <span className="text-sm">Dashboard</span>
                </Link>
                <Link href="/readiness" className="flex items-center gap-3 px-4 py-3 text-[#464555] hover:text-[#3525cd] hover:bg-[#3525cd]/5 transition-all duration-300 rounded-lg group">
                    <FiTarget size={18} />
                    <span className="text-sm">Readiness</span>
                </Link>
                <Link href="/interview" className="flex items-center gap-3 px-4 py-3 text-[#464555] hover:text-[#3525cd] hover:bg-[#3525cd]/5 transition-all duration-300 rounded-lg group">
                    <FiPlay size={18} />
                    <span className="text-sm">Interviews</span>
                </Link>
                <Link href="/resume" className="flex items-center gap-3 px-4 py-3 text-[#464555] hover:text-[#3525cd] hover:bg-[#3525cd]/5 transition-all duration-300 rounded-lg group">
                    <FiFileText size={18} />
                    <span className="text-sm">Resume</span>
                </Link>
                <Link href="/recruiter" className="flex items-center gap-3 px-4 py-3 text-[#464555] hover:text-[#3525cd] hover:bg-[#3525cd]/5 transition-all duration-300 rounded-lg group">
                    <FiBriefcase size={18} />
                    <span className="text-sm">Recruiter</span>
                </Link>
                <Link href="/arena" className="flex items-center gap-3 px-4 py-3 text-[#464555] hover:text-[#3525cd] hover:bg-[#3525cd]/5 transition-all duration-300 rounded-lg group">
                    <FiAward size={18} />
                    <span className="text-sm">Arena</span>
                </Link>
                <div className="flex items-center gap-3 px-4 py-3 text-[#3525cd] font-bold border-l-4 border-[#3525cd] bg-[#3525cd]/5 rounded-r-lg group mt-4">
                    <FiSettings size={18} />
                    <span className="text-sm">Settings</span>
                </div>
            </nav>
        </aside>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-[#F8FAFC] text-[#111c2d]">
            <Sidebar />
            <main className="flex-1 ml-0 md:ml-64 h-full overflow-y-auto w-full pt-[72px] px-4 md:px-8 py-8">
                <div className="fade-in max-w-[900px] mx-auto mt-4">
                    
                    <Link href="/dashboard" className="inline-flex items-center gap-2 text-[#464555] hover:text-[#3525cd] text-sm font-semibold mb-6 transition-colors">
                        <FiArrowLeft size={16} /> Back to Dashboard
                    </Link>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8 glass-card p-6 rounded-[24px]">
                        <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-[#3525cd] to-[#6C5CE7] shadow-lg shadow-[#3525cd]/30 flex items-center justify-center shrink-0">
                            <FiShield size={28} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-2 text-[#111c2d]">Security Settings</h1>
                            <p className="text-sm text-gray-500 font-medium">Manage your active sessions and monitor account activity.</p>
                        </div>
                    </div>

                    <div className="grid gap-8">
                        {/* Active Sessions */}
                        <section>
                            <h2 className="text-xl font-bold text-[#111c2d] mb-4 flex items-center gap-3">
                                Active Sessions
                                <span className="text-[10px] px-3 py-1 bg-[#F5A623]/10 text-[#F5A623] rounded-full font-bold uppercase tracking-wider">Duplicate Prevention Active</span>
                            </h2>
                            <div className="flex flex-col gap-4">
                                {sessions.map(session => (
                                    <div key={session.id} className={`glass-card p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 ${session.isCurrent ? "border-l-4 border-l-[#006a61]" : "neomorphic-hover"}`}>
                                        <div className="flex items-start sm:items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 shrink-0 shadow-sm border border-gray-100">
                                                {getDeviceIcon(session.deviceInfo)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-[#111c2d] flex items-center gap-2 mb-1">
                                                    {session.deviceInfo.split(" ")[0] || "Unknown Browser"}
                                                    {session.isCurrent && <span className="text-[10px] px-2 py-0.5 bg-[#006a61]/10 text-[#006a61] rounded-full uppercase tracking-wider">This Device</span>}
                                                </p>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 font-medium">
                                                    <span>IP: {session.ipAddress}</span>
                                                    <span className="flex items-center gap-1 font-mono"><FiClock size={12} /> {new Date(session.lastActive).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {!session.isCurrent && (
                                            <button 
                                                onClick={() => revokeSession(session.id)} 
                                                className="px-4 py-2 bg-white border border-[#E53E3E]/20 text-[#E53E3E] rounded-xl hover:bg-[#E53E3E]/5 transition-colors text-xs font-bold flex items-center justify-center gap-2 w-full sm:w-auto shadow-sm"
                                            >
                                                <FiXCircle size={14} /> Revoke
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {sessions.length === 0 && <p className="text-sm text-gray-400 italic p-4 glass-card rounded-2xl text-center">No active sessions found.</p>}
                            </div>
                        </section>

                        {/* Security Logs */}
                        <section>
                            <h2 className="text-xl font-bold text-[#111c2d] mb-4">Recent Activity</h2>
                            <div className="glass-card rounded-[24px] p-0 overflow-hidden">
                                {logs.length === 0 ? (
                                    <p className="p-8 text-sm text-gray-400 text-center italic">No recent activity to display.</p>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {logs.map((log) => (
                                            <div key={log._id} className="p-5 sm:p-6 flex gap-4 hover:bg-gray-50/50 transition-colors">
                                                <div className="mt-1">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${log.event.includes("failed") || log.event.includes("locked") || log.event.includes("suspicious") ? "bg-[#E53E3E]/10" : "bg-[#006a61]/10"}`}>
                                                        {getEventIcon(log.event)}
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-[#111c2d] mb-1">{formatEventName(log.event)}</p>
                                                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 font-medium mb-2">
                                                        <span className="font-mono">{new Date(log.createdAt).toLocaleString()}</span>
                                                        <span className="hidden sm:inline">•</span>
                                                        <span>{log.ipAddress}</span>
                                                    </div>
                                                    {log.details && (
                                                        <p className="text-xs text-[#464555] font-medium bg-gray-50 border border-gray-100 p-3 rounded-lg shadow-sm">
                                                            {log.details}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
