"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { FiTarget, FiTrendingUp, FiBookOpen, FiStar, FiRefreshCw, FiClock, FiGrid, FiPlay, FiFileText, FiBriefcase, FiAward, FiSettings } from "react-icons/fi";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import Link from "next/link";

export default function ReadinessPage() {
    const { user, token, isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();

    const [experienceLevel, setExperienceLevel] = useState("Fresher");
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [resumeDataForContext, setResumeDataForContext] = useState("");

    const fetchHistory = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch("/api/readiness", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setExperienceLevel(data.experienceLevel || "Fresher");
                setHistory(data.readinessHistory || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) router.push("/login");
        else fetchHistory();
    }, [authLoading, isAuthenticated, fetchHistory, router]);

    const generateEvaluation = async () => {
        if (!token) return;
        setGenerating(true);
        try {
            const res = await fetch("/api/readiness", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ experienceLevel, resumeAnalysisText: resumeDataForContext })
            });
            const data = await res.json();
            if (res.ok) {
                fetchHistory();
            } else {
                alert(data.error || "Failed to generate evaluation");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setGenerating(false);
        }
    };

    if (authLoading || loading) {
        return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center"><div className="spinner-lg spinner" /></div>;
    }

    const currentEval = history[history.length - 1];

    const chartData = history.map((h, i) => ({
        name: `Eval ${i + 1}`,
        Score: h.score,
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
                <Link href="/readiness" className="relative flex items-center gap-3 px-4 py-3 text-[#3525cd] font-bold border-l-4 border-[#3525cd] bg-[#3525cd]/5 rounded-r-lg group">
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
                <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-[#464555] hover:text-[#3525cd] hover:bg-[#3525cd]/5 transition-all duration-300 rounded-lg group"><FiSettings size={18} /><span className="text-sm">Settings</span></Link>
            </nav>
        </aside>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-[#F8FAFC] text-[#111c2d]">
            <Sidebar />
            <main className="flex-1 ml-0 md:ml-64 h-full overflow-y-auto w-full pt-[72px] px-4 md:px-8 py-8">
                <div className="fade-in max-w-[1200px] mx-auto mt-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 glass-card p-6 rounded-2xl">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Placement Readiness Engine</h1>
                            <p className="text-sm text-[#464555]">AI-analyzed roadmap based on your interviews and resume.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                            <select
                                value={experienceLevel}
                                onChange={(e) => setExperienceLevel(e.target.value)}
                                className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#3525cd]/30"
                            >
                                <option value="Fresher">Fresher Level</option>
                                <option value="Internship Seeker">Internship Seeker</option>
                                <option value="Experienced">Experienced Professional</option>
                            </select>
                            <button 
                                onClick={generateEvaluation} 
                                disabled={generating} 
                                className="px-6 py-3 rounded-xl font-bold bg-[#3525cd] text-white hover:bg-[#281a9c] transition-colors flex items-center justify-center gap-2 shadow-md shadow-[#3525cd]/20 disabled:opacity-50 w-full sm:w-auto"
                            >
                                {generating ? <div className="spinner border-t-white" style={{ width: "16px", height: "16px" }} /> : <FiRefreshCw />}
                                Generate Evaluation
                            </button>
                        </div>
                    </div>

                    {!currentEval ? (
                        <div className="glass-card rounded-[24px] p-12 text-center max-w-2xl mx-auto border-dashed border-2 border-gray-200 bg-white/50">
                            <div className="w-16 h-16 rounded-full bg-[#3525cd]/10 text-[#3525cd] flex items-center justify-center mx-auto mb-6">
                                <FiTarget size={32} />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">No Data Yet</h3>
                            <p className="text-[#464555] mb-8 leading-relaxed">
                                Optionally paste your resume text below, hit Generate, and our AI will comb through your historical interview performance to curate your personalized placement roadmap.
                            </p>
                            <textarea
                                className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#3525cd]/30 resize-none mb-6"
                                placeholder="Optional: Paste resume text for better context..."
                                value={resumeDataForContext}
                                onChange={(e) => setResumeDataForContext(e.target.value)}
                                style={{ minHeight: "160px" }}
                            />
                            <button 
                                onClick={generateEvaluation} 
                                disabled={generating} 
                                className="px-8 py-4 rounded-xl font-bold bg-[#3525cd] text-white hover:bg-[#281a9c] transition-colors shadow-lg shadow-[#3525cd]/20 disabled:opacity-50"
                            >
                                Generate First Report
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Header Stats */}
                            <div className="lg:col-span-1 flex flex-col gap-6">
                                <div className="glass-card rounded-[24px] p-8 text-center relative overflow-hidden neomorphic-hover cursor-default">
                                    <div className="absolute top-0 left-0 right-0 h-1" style={{ background: currentEval.category === "Placement Ready" ? "#006a61" : currentEval.category === "High Potential Candidate" ? "#F5A623" : "#E53E3E" }} />
                                    
                                    <p className="text-xs font-bold text-[#464555] uppercase tracking-wider mb-6">Readiness Score</p>

                                    <div className={`w-32 h-32 mx-auto rounded-full border-8 flex flex-col items-center justify-center mb-6 bg-white shadow-inner
                                        ${currentEval.score >= 80 ? "border-[#006a61]" : currentEval.score >= 50 ? "border-[#F5A623]" : "border-[#E53E3E]"}`}>
                                        <span className="text-4xl font-black">{currentEval.score}</span>
                                        <span className="text-sm font-bold text-gray-400">/100</span>
                                    </div>

                                    <span className={`inline-block px-5 py-2 rounded-full text-sm font-bold tracking-wide
                                        ${currentEval.category === "Placement Ready" ? "bg-[#006a61]/10 text-[#006a61]" : currentEval.category === "High Potential Candidate" ? "bg-[#F5A623]/10 text-[#F5A623]" : "bg-[#E53E3E]/10 text-[#E53E3E]"}`}>
                                        {currentEval.category}
                                    </span>
                                </div>

                                {/* Weak Areas & Substats */}
                                <div className="glass-card rounded-[24px] p-6 neomorphic-hover cursor-default">
                                    <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                                        <FiTrendingUp className="text-[#E53E3E]" /> Critical Gaps
                                    </h3>
                                    <div className="mb-6">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Weak Areas</p>
                                        <div className="flex flex-wrap gap-2">
                                            {currentEval.weakAreas.map((a: string, i: number) => (
                                                <span key={i} className="px-3 py-1.5 bg-[#E53E3E]/10 border border-[#E53E3E]/20 text-[#E53E3E] rounded-lg text-xs font-bold">{a}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Missing Skills ({experienceLevel})</p>
                                        <div className="flex flex-wrap gap-2">
                                            {currentEval.missingSkills.map((s: string, i: number) => (
                                                <span key={i} className="px-3 py-1.5 bg-gray-100 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* History Chart */}
                                {history.length > 1 && (
                                    <div className="glass-card rounded-[24px] p-6 neomorphic-hover cursor-default">
                                        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                                            <FiClock className="text-[#3525cd]" /> Recommendation History
                                        </h3>
                                        <div className="h-40">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={chartData}>
                                                    <XAxis dataKey="name" fontSize={11} stroke="#9A8677" tickLine={false} axisLine={false} />
                                                    <YAxis fontSize={11} stroke="#9A8677" tickLine={false} axisLine={false} domain={[0, 100]} />
                                                    <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #eee", boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }} />
                                                    <Line type="monotone" dataKey="Score" stroke="#3525cd" strokeWidth={3} dot={{ r: 4, fill: "#3525cd", strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Roadmap Details */}
                            <div className="lg:col-span-2 glass-card rounded-[24px] p-8 lg:p-10 flex flex-col gap-8">
                                <h2 className="text-2xl font-bold border-b border-gray-200 pb-4 mb-2">
                                    Personalized Strategic Roadmap
                                </h2>

                                <div>
                                    <h3 className="text-base font-bold text-[#464555] mb-4 flex items-center gap-2"><FiStar className="text-[#3525cd]" /> Recommended Technologies to Learn</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {currentEval.roadmap.technologies.map((t: string, i: number) => (
                                            <div key={i} className="p-4 rounded-xl bg-[#3525cd]/5 border border-[#3525cd]/10 text-sm font-bold text-[#3525cd] flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#3525cd]"></div>
                                                {t}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-base font-bold text-[#464555] mb-4 flex items-center gap-2"><FiBookOpen className="text-[#006a61]" /> Suggested Projects</h3>
                                    <div className="flex flex-col gap-3">
                                        {currentEval.roadmap.projects.map((p: string, i: number) => (
                                            <div key={i} className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm border-l-4 border-l-[#006a61] text-sm font-semibold text-gray-700">
                                                {p}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                                    <div>
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Certifications</h3>
                                        <ul className="space-y-3">
                                            {currentEval.roadmap.certifications.map((c: string, i: number) => (
                                                <li key={i} className="text-sm font-medium text-gray-700 flex items-start gap-2">
                                                    <span className="text-[#3525cd] mt-1">•</span> {c}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Next Interview Topics</h3>
                                        <ul className="space-y-3">
                                            {currentEval.roadmap.topics.map((t: string, i: number) => (
                                                <li key={i} className="text-sm font-medium text-gray-700 flex items-start gap-2">
                                                    <span className="text-[#006a61] mt-1">•</span> {t}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
