"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiArrowUp, FiArrowDown, FiMinus, FiClock, FiGrid, FiTarget, FiPlay, FiFileText, FiBriefcase, FiAward, FiSettings } from "react-icons/fi";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Question {
    question: string;
    answer: string;
    score: number;
    difficulty: number;
    feedback: string;
    timeTaken: number;
    skipped: boolean;
}

interface ReportData {
    _id: string;
    topic: string;
    questions: Question[];
    totalScore: number;
    averageScore: number;
    peakDifficulty: number;
    totalQuestions: number;
    createdAt: string;
}

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user, token, isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();
    const [report, setReport] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedQ, setExpandedQ] = useState<number | null>(null);

    const fetchReport = useCallback(async () => {
        if (!token || !id) return;
        try {
            const res = await fetch(`/api/interview?id=${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.interview) setReport(data.interview);
        } catch (err) {
            console.error("Failed to fetch report:", err);
        } finally {
            setLoading(false);
        }
    }, [token, id]);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) { router.push("/login"); return; }
        if (token) fetchReport();
    }, [authLoading, isAuthenticated, token, router, fetchReport]);

    const difficultyLabel = (d: number) => ["", "Easy", "Basic", "Intermediate", "Advanced", "Expert"][d] || "";
    const difficultyColor = (d: number) => ["", "#006a61", "#89f5e7", "#F5A623", "#E53E3E", "#92002a"][d] || "#464555";
    const scoreColor = (s: number) => s >= 7 ? "#006a61" : s >= 4 ? "#F5A623" : "#E53E3E";

    if (authLoading || loading) {
        return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center"><div className="spinner-lg spinner border-t-[#3525cd]" /></div>;
    }

    if (!report) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center flex-col gap-4">
                <p className="text-5xl">📋</p>
                <p className="text-[#464555] font-semibold">Report not found</p>
                <Link href="/dashboard" className="px-6 py-3 rounded-xl font-bold bg-[#3525cd] text-white hover:bg-[#281a9c] transition-colors shadow-lg shadow-[#3525cd]/20">Back to Dashboard</Link>
            </div>
        );
    }

    const chartData = report.questions.map((q, i) => ({
        name: `Q${i + 1}`,
        difficulty: q.difficulty,
        score: q.score,
    }));

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
                <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-[#464555] hover:text-[#3525cd] hover:bg-[#3525cd]/5 transition-all duration-300 rounded-lg group">
                    <FiSettings size={18} />
                    <span className="text-sm">Settings</span>
                </Link>
            </nav>
        </aside>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-[#F8FAFC] text-[#111c2d]">
            <Sidebar />
            <main className="flex-1 ml-0 md:ml-64 h-full overflow-y-auto w-full pt-[72px] px-4 md:px-8 py-8">
                <div className="fade-in max-w-[900px] mx-auto mt-4">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 glass-card p-6 rounded-[24px]">
                        <div>
                            <Link href="/dashboard" className="inline-flex items-center gap-2 text-[#464555] hover:text-[#3525cd] text-sm font-semibold mb-4 transition-colors">
                                <FiArrowLeft size={16} /> Back to Dashboard
                            </Link>
                            <h1 className="text-3xl font-bold mb-2">Interview Report</h1>
                            <p className="text-sm text-gray-500 font-medium">
                                {report.topic} • {new Date(report.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                            </p>
                        </div>
                        {/* Overall Score */}
                        <div className="mt-6 sm:mt-0">
                            <div className={`w-24 h-24 rounded-full border-8 flex flex-col items-center justify-center bg-white shadow-sm shrink-0
                                ${report.averageScore >= 7 ? "border-[#006a61]" : report.averageScore >= 4 ? "border-[#F5A623]" : "border-[#E53E3E]"}`}>
                                <span className="text-3xl font-black">{report.averageScore.toFixed(1)}</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">/10 avg</span>
                            </div>
                        </div>
                    </div>

                    {/* Difficulty Progression Chart */}
                    <div className="glass-card rounded-[24px] p-6 lg:p-8 mb-8 neomorphic-hover cursor-default">
                        <h2 className="text-lg font-bold mb-6">Difficulty Progression</h2>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                    <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ background: "rgba(255, 255, 255, 0.9)", border: "none", borderRadius: "12px", boxShadow: "0 8px 30px rgba(0,0,0,0.12)", backdropFilter: "blur(8px)" }}
                                        labelStyle={{ color: "#111c2d", fontWeight: "bold", marginBottom: "4px" }}
                                    />
                                    <Line type="monotone" dataKey="difficulty" stroke="#3525cd" strokeWidth={3} dot={{ fill: "#3525cd", strokeWidth: 2, r: 4, stroke: "white" }} activeDot={{ r: 6, strokeWidth: 0 }} name="Difficulty" />
                                    <Line type="monotone" dataKey="score" stroke="#006a61" strokeWidth={2} dot={{ fill: "#006a61", r: 3 }} strokeDasharray="5 5" name="Score" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                        <div className="glass-card rounded-[24px] p-6 text-center neomorphic-hover cursor-default">
                            <p className="text-3xl font-black mb-2">{report.questions.length}</p>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Questions Answered</p>
                        </div>
                        <div className="glass-card rounded-[24px] p-6 text-center neomorphic-hover cursor-default">
                            <p className="text-3xl font-black mb-2">Level {report.peakDifficulty}</p>
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mx-auto" style={{ background: `${difficultyColor(report.peakDifficulty)}15`, color: difficultyColor(report.peakDifficulty) }}>
                                {difficultyLabel(report.peakDifficulty)}
                            </span>
                        </div>
                        <div className="glass-card rounded-[24px] p-6 text-center neomorphic-hover cursor-default">
                            <p className="text-3xl font-black mb-2">{report.totalScore}</p>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Score</p>
                        </div>
                    </div>

                    {/* Question Timeline */}
                    <h2 className="text-2xl font-bold mb-6">Question Timeline</h2>
                    <div className="flex flex-col gap-4 mb-10">
                        {report.questions.map((q, i) => {
                            const prevDiff = i > 0 ? report.questions[i - 1].difficulty : q.difficulty;
                            const diffChange = q.difficulty - prevDiff;

                            return (
                                <div key={i} className="glass-card rounded-[20px] p-0 overflow-hidden group transition-all duration-300">
                                    <div 
                                        className="p-5 sm:p-6 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors"
                                        onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                                    >
                                        <div className="flex items-start sm:items-center gap-4 flex-1 pr-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0
                                                ${q.score >= 7 ? "bg-[#006a61]/10 text-[#006a61]" : q.score >= 4 ? "bg-[#F5A623]/10 text-[#F5A623]" : "bg-[#E53E3E]/10 text-[#E53E3E]"}`}>
                                                Q{i + 1}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-[#111c2d] leading-relaxed">
                                                    {q.question.length > 90 ? q.question.substring(0, 90) + "..." : q.question}
                                                </p>
                                                {q.skipped && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider mt-2 inline-block">SKIPPED</span>}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 sm:gap-6 ml-14 sm:ml-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                                <span className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ background: `${difficultyColor(q.difficulty)}10`, color: difficultyColor(q.difficulty) }}>
                                                    {difficultyLabel(q.difficulty)}
                                                </span>
                                                <div className="flex items-center gap-1 w-6 justify-center">
                                                    {diffChange > 0 && <FiArrowUp size={16} className="text-[#006a61]" />}
                                                    {diffChange < 0 && <FiArrowDown size={16} className="text-[#E53E3E]" />}
                                                    {diffChange === 0 && i > 0 && <FiMinus size={16} className="text-[#F5A623]" />}
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end">
                                                <span className={`text-lg font-black ${q.score >= 7 ? "text-[#006a61]" : q.score >= 4 ? "text-[#F5A623]" : "text-[#E53E3E]"}`}>
                                                    {q.score}<span className="text-xs text-gray-400">/10</span>
                                                </span>
                                                {q.timeTaken > 0 && (
                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 font-mono mt-1">
                                                        <FiClock size={10} /> {Math.floor(q.timeTaken / 60)}:{(q.timeTaken % 60).toString().padStart(2, "0")}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded details */}
                                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedQ === i ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="p-6 pt-0 border-t border-gray-100 bg-gray-50/30">
                                            <div className="mt-6">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Full Question</p>
                                                <p className="text-sm text-[#111c2d] font-medium leading-relaxed bg-white p-4 rounded-xl border border-gray-100 shadow-sm">{q.question}</p>
                                            </div>

                                            <div className="mt-6">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Your Answer</p>
                                                <p className={`text-sm leading-relaxed p-4 rounded-xl border border-gray-100 shadow-sm bg-white ${q.skipped ? 'italic text-gray-400' : 'text-[#464555] font-medium'}`}>
                                                    {q.skipped ? "(Skipped)" : q.answer}
                                                </p>
                                            </div>

                                            {q.feedback && (
                                                <div className="mt-6">
                                                    <p className="text-xs font-bold text-[#3525cd] uppercase tracking-wider mb-2">AI Feedback</p>
                                                    <div className="p-4 rounded-xl bg-[#3525cd]/5 border border-[#3525cd]/10 text-sm text-[#111c2d] font-medium leading-relaxed">
                                                        {q.feedback}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/dashboard" className="px-8 py-4 rounded-xl font-bold bg-white border border-gray-200 text-[#464555] hover:bg-gray-50 transition-colors shadow-sm flex items-center justify-center gap-2">
                            <FiArrowLeft size={18} /> Back to Dashboard
                        </Link>
                        <Link href="/interview" className="px-8 py-4 rounded-xl font-bold bg-[#3525cd] text-white hover:bg-[#281a9c] transition-colors shadow-lg shadow-[#3525cd]/20 flex items-center justify-center">
                            Start New Interview
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
