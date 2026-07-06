"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    FiGrid, FiTarget, FiPlay, FiFileText, FiBriefcase, FiAward, FiSettings,
    FiMessageSquare, FiBarChart2, FiTrendingUp, FiPlus, FiFile
} from "react-icons/fi";

interface InterviewSummary {
    _id: string;
    topic: string;
    status: string;
    totalScore: number;
    averageScore: number;
    peakDifficulty: number;
    totalQuestions: number;
    company?: string;
    interviewMode?: string;
    createdAt: string;
    questions: { score: number; difficulty: number }[];
}

export default function DashboardPage() {
    const { user, token, isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();
    const [interviews, setInterviews] = useState<InterviewSummary[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchInterviews = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch("/api/interview", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.interviews) setInterviews(data.interviews);
        } catch (err) {
            console.error("Failed to fetch interviews:", err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) { router.push("/login"); return; }
        if (token) fetchInterviews();
    }, [authLoading, isAuthenticated, token, router, fetchInterviews]);

    if (authLoading || (!isAuthenticated && !authLoading)) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="spinner-lg spinner" />
            </div>
        );
    }

    const totalInterviews = interviews.length;
    const completedInterviews = interviews.filter((i) => i.status === "completed");
    const avgScore = completedInterviews.length > 0
        ? (completedInterviews.reduce((s, i) => s + i.averageScore, 0) / completedInterviews.length).toFixed(1)
        : "0.0";
    const peakDiff = completedInterviews.length > 0
        ? Math.max(...completedInterviews.map((i) => i.peakDifficulty))
        : 0;

    return (
        <div className="flex h-screen overflow-hidden bg-[#F8FAFC] text-[#111c2d]">
            {/* Sidebar */}
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
                    <Link href="/dashboard" className="relative flex items-center gap-3 px-4 py-3 text-[#3525cd] font-bold border-l-4 border-[#3525cd] bg-[#3525cd]/5 rounded-r-lg group">
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
                    <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-[#464555] hover:text-[#3525cd] hover:bg-[#3525cd]/5 transition-all duration-300 rounded-lg group">
                        <FiSettings size={18} />
                        <span className="text-sm">Settings</span>
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-0 md:ml-64 h-full overflow-y-auto w-full pt-[72px]">
                <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 md:py-10 flex flex-col gap-8 fade-in">
                    {/* Header */}
                    <header className="flex flex-col gap-2">
                        <h1 className="text-4xl font-bold">Welcome back, {user?.name?.split(" ")[0]}</h1>
                        <p className="text-lg text-[#464555] max-w-2xl">
                            Here's your interview preparation progress. Ready to level up?
                        </p>
                    </header>

                    {/* Stats Row */}
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="glass-card rounded-[20px] p-6 flex items-center gap-4 neomorphic-hover cursor-default">
                            <div className="w-12 h-12 rounded-xl icon-container-primary flex items-center justify-center shrink-0">
                                <FiMessageSquare size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-[#464555] uppercase tracking-wider mb-1">Total Interviews</p>
                                <p className="text-3xl font-bold">{totalInterviews}</p>
                            </div>
                        </div>

                        <div className="glass-card rounded-[20px] p-6 flex items-center gap-4 neomorphic-hover cursor-default">
                            <div className="w-12 h-12 rounded-xl icon-container-secondary flex items-center justify-center shrink-0">
                                <FiBarChart2 size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-[#464555] uppercase tracking-wider mb-1">Avg Score</p>
                                <p className="text-3xl font-bold">{avgScore}<span className="text-lg font-normal text-[#777587]">/10</span></p>
                            </div>
                        </div>

                        <div className="glass-card rounded-[20px] p-6 flex items-center gap-4 neomorphic-hover cursor-default">
                            <div className="w-12 h-12 rounded-xl bg-[#ffdadb] text-[#92002a] flex items-center justify-center shrink-0">
                                <FiTrendingUp size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-[#464555] uppercase tracking-wider mb-1">Peak Difficulty</p>
                                <p className="text-3xl font-bold">Lvl {peakDiff}</p>
                            </div>
                        </div>
                    </section>

                    {/* Quick Actions */}
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Link href="/interview" className="relative overflow-hidden glass-card rounded-[20px] p-6 text-left group neomorphic-hover">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#3525cd]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="w-10 h-10 rounded-full bg-[#3525cd] text-white flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(53,37,205,0.3)]">
                                <FiPlus size={20} />
                            </div>
                            <h3 className="text-xl font-bold mb-1">Start New Interview</h3>
                            <p className="text-sm text-[#464555]">Practice with adaptive AI questions</p>
                        </Link>

                        <Link href="/resume" className="relative overflow-hidden glass-card rounded-[20px] p-6 text-left group neomorphic-hover">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#006a61]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="w-10 h-10 rounded-full border border-[#006a61] text-[#006a61] flex items-center justify-center mb-4">
                                <FiFile size={20} />
                            </div>
                            <h3 className="text-xl font-bold mb-1">Analyze Resume</h3>
                            <p className="text-sm text-[#464555]">Get AI-powered resume feedback</p>
                        </Link>

                        <Link href="/readiness" className="relative overflow-hidden glass-card rounded-[20px] p-6 text-left group neomorphic-hover">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#95002b]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="w-10 h-10 rounded-full border border-[#777587] text-[#464555] flex items-center justify-center mb-4">
                                <FiTarget size={20} />
                            </div>
                            <h3 className="text-xl font-bold mb-1">AI Readiness</h3>
                            <p className="text-sm text-[#464555]">Generate career placement roadmap</p>
                        </Link>
                    </section>

                    {/* Featured Tools */}
                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Link href="/recruiter" className="gradient-banner-1 rounded-[20px] p-8 relative overflow-hidden flex flex-col justify-between min-h-[220px] neomorphic-hover cursor-pointer group">
                            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[#3525cd]/10 rounded-full blur-3xl group-hover:bg-[#3525cd]/20 transition-all"></div>
                            <div className="flex justify-between items-start relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-white/80 backdrop-blur-md flex items-center justify-center text-[#3525cd] shadow-sm border border-white/50">
                                    <FiBriefcase size={24} />
                                </div>
                                <span className="px-3 py-1 bg-[#3525cd] text-white rounded-full text-[10px] font-bold tracking-widest uppercase">New</span>
                            </div>
                            <div className="relative z-10 mt-6">
                                <h3 className="text-2xl font-bold mb-2">AI Recruiter Simulator</h3>
                                <p className="text-sm text-[#464555] max-w-sm">Experience realistic mock interviews tailored to top tech companies.</p>
                            </div>
                        </Link>

                        <Link href="/arena" className="gradient-banner-2 rounded-[20px] p-8 relative overflow-hidden flex flex-col justify-between min-h-[220px] neomorphic-hover cursor-pointer group">
                            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[#006a61]/10 rounded-full blur-3xl group-hover:bg-[#006a61]/20 transition-all"></div>
                            <div className="flex justify-between items-start relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-white/80 backdrop-blur-md flex items-center justify-center text-[#006a61] shadow-sm border border-white/50">
                                    <FiAward size={24} />
                                </div>
                                <span className="px-3 py-1 bg-[#3525cd] text-white rounded-full text-[10px] font-bold tracking-widest uppercase">New</span>
                            </div>
                            <div className="relative z-10 mt-6">
                                <h3 className="text-2xl font-bold mb-2">Peer Challenge Arena</h3>
                                <p className="text-sm text-[#464555] max-w-sm">Compete in live, timed challenges against other professionals.</p>
                            </div>
                        </Link>
                    </section>

                    {/* Recent Activity */}
                    <section className="flex flex-col gap-4">
                        <div className="flex justify-between items-center px-2">
                            <h2 className="text-2xl font-bold">Recent Interviews</h2>
                            {interviews.length > 5 && (
                                <Link href="/interview" className="text-[#3525cd] text-sm font-semibold hover:underline">View All</Link>
                            )}
                        </div>

                        {loading ? (
                            <div className="text-center py-10"><div className="spinner mx-auto" /></div>
                        ) : interviews.length === 0 ? (
                            <div className="glass-card rounded-[20px] p-10 text-center">
                                <p className="text-4xl mb-4">🎯</p>
                                <p className="text-lg font-bold mb-2">No interviews yet</p>
                                <p className="text-[#464555] mb-6">Start your first adaptive interview to track your progress.</p>
                                <Link href="/interview" className="btn-primary" style={{ background: '#3525cd' }}>Start Interview</Link>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {interviews.slice(0, 5).map((interview) => (
                                    <Link
                                        key={interview._id}
                                        href={interview.status === "completed" ? `/report/${interview._id}` : `/interview?resume=${interview._id}`}
                                        className="glass-card rounded-[20px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/90 transition-colors cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-[#f0f3ff] flex items-center justify-center shrink-0 group-hover:bg-[#3525cd]/10 transition-colors">
                                                <FiBriefcase className="text-[#777587] group-hover:text-[#3525cd] transition-colors" size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-semibold">{interview.topic}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {interview.company && (
                                                        <span className="text-xs px-2 py-0.5 rounded-md bg-[#d8e3fb] text-[#464555] font-semibold">{interview.company}</span>
                                                    )}
                                                    {interview.company && <span className="w-1 h-1 rounded-full bg-[#c7c4d8]"></span>}
                                                    <span className="text-xs text-[#464555]">{new Date(interview.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 sm:ml-auto pl-16 sm:pl-0">
                                            {interview.status === "completed" && (
                                                <div className="flex flex-col items-start sm:items-end">
                                                    <span className="text-sm font-bold">Score: {interview.averageScore.toFixed(1)}/10</span>
                                                    <span className="text-[11px] text-[#777587] font-semibold">Lvl {interview.peakDifficulty} Difficulty</span>
                                                </div>
                                            )}
                                            {interview.status === "completed" ? (
                                                <span className="pill-complete px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 w-28 text-center leading-tight">Complete</span>
                                            ) : (
                                                <span className="pill-requires-practice px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 w-28 text-center leading-tight">In Progress</span>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
