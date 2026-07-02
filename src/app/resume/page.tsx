"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { FiUpload, FiCheck, FiAlertCircle, FiGrid, FiTarget, FiPlay, FiFileText, FiBriefcase, FiAward, FiSettings } from "react-icons/fi";
import Link from "next/link";

export default function ResumePage() {
    const { user, token, isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();
    const [resumeText, setResumeText] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<{
        overallScore: number;
        strengths: string[];
        weaknesses: string[];
        suggestions: string[];
        keywords: string[];
        summary: string;
    } | null>(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) router.push("/login");
    }, [authLoading, isAuthenticated, router]);

    const analyzeResume = async () => {
        if (!file && (!resumeText.trim() || resumeText.trim().length < 50)) return;
        setLoading(true);
        try {
            const formData = new FormData();
            if (file) {
                formData.append("file", file);
            } else {
                formData.append("resumeText", resumeText);
            }

            const res = await fetch("/api/resume", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }, // don't set Content-Type manually for FormData
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setAnalysis(data.analysis);
        } catch (err) {
            console.error(err);
            alert("Failed to analyze resume. Please check your Groq API key.");
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center"><div className="spinner-lg spinner" /></div>;
    }

    const scoreColor = (s: number) => s >= 70 ? "#006a61" : s >= 40 ? "#F5A623" : "#E53E3E";

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
                <Link href="/resume" className="relative flex items-center gap-3 px-4 py-3 text-[#3525cd] font-bold border-l-4 border-[#3525cd] bg-[#3525cd]/5 rounded-r-lg group">
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
                <div className="fade-in max-w-[900px] mx-auto mt-4">
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">Resume Analyzer</h1>
                        <p className="text-sm text-[#464555]">Paste your resume text to get AI-powered feedback and suggestions.</p>
                    </header>

                    <div className="glass-card rounded-[24px] p-6 lg:p-8 mb-8 neomorphic-hover cursor-default">
                        {/* File Upload Area */}
                        <div className="mb-6 relative">
                            <input 
                                type="file" 
                                accept="application/pdf"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setFile(e.target.files[0]);
                                        setResumeText(""); // clear text if file selected
                                    }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className={`w-full border-2 border-dashed rounded-xl p-8 text-center transition-colors ${file ? 'border-[#3525cd] bg-[#3525cd]/5' : 'border-gray-300 hover:border-[#3525cd] bg-white'}`}>
                                <FiFileText size={40} className={`mx-auto mb-3 ${file ? 'text-[#3525cd]' : 'text-gray-400'}`} />
                                <p className="text-base font-medium text-[#111c2d]">
                                    {file ? file.name : "Drag & drop your PDF resume here, or click to browse"}
                                </p>
                                {!file && <p className="text-xs text-gray-400 mt-1">Supports .pdf files</p>}
                            </div>
                            {file && (
                                <button 
                                    onClick={(e) => { e.preventDefault(); setFile(null); }}
                                    className="absolute top-4 right-4 z-20 text-sm font-bold text-red-500 hover:text-red-700 bg-white px-2 py-1 rounded"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        <div className="my-6 flex items-center gap-4">
                            <div className="h-px bg-gray-200 flex-1"></div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">OR PASTE TEXT</span>
                            <div className="h-px bg-gray-200 flex-1"></div>
                        </div>

                        <textarea
                            className="w-full bg-white border border-gray-200 rounded-xl p-6 text-base text-[#111c2d] focus:outline-none focus:ring-2 focus:ring-[#3525cd]/30 resize-y mb-4 placeholder-gray-400 disabled:opacity-50 disabled:bg-gray-50"
                            placeholder={file ? "PDF is selected. Clear it to paste text instead." : "Paste your resume text here... (minimum 50 characters)"}
                            value={resumeText}
                            onChange={(e) => {
                                setResumeText(e.target.value);
                                setFile(null); // clear file if typing
                            }}
                            disabled={!!file}
                            style={{ minHeight: "150px" }}
                        />
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-gray-400">{file ? "PDF Ready" : `${resumeText.length} characters`}</span>
                            <button
                                className="px-8 py-4 rounded-xl font-bold bg-[#3525cd] text-white hover:bg-[#281a9c] transition-colors shadow-lg shadow-[#3525cd]/20 flex items-center gap-2 disabled:opacity-50 disabled:shadow-none"
                                onClick={analyzeResume}
                                disabled={loading || (!file && resumeText.trim().length < 50)}
                            >
                                {loading ? <div className="spinner border-t-white" style={{ width: "20px", height: "20px" }} /> : <><FiUpload size={20} /> Analyze Resume</>}
                            </button>
                        </div>
                    </div>

                    {analysis && (
                        <div className="slide-up flex flex-col gap-6">
                            {/* Score */}
                            <div className="gradient-banner-2 rounded-[24px] p-8 flex items-center gap-8 shadow-sm border border-white/60">
                                <div className={`w-28 h-28 rounded-full border-8 flex flex-col items-center justify-center bg-white shadow-inner shrink-0
                                    ${analysis.overallScore >= 70 ? "border-[#006a61]" : analysis.overallScore >= 40 ? "border-[#F5A623]" : "border-[#E53E3E]"}`}>
                                    <span className="text-4xl font-black">{analysis.overallScore}</span>
                                    <span className="text-xs font-bold text-gray-400">/100</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2">Overall Assessment</h3>
                                    <p className="text-sm text-[#464555] leading-relaxed font-medium">{analysis.summary}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Strengths */}
                                <div className="glass-card rounded-[24px] p-8 neomorphic-hover cursor-default border-t-4 border-t-[#006a61]">
                                    <h3 className="text-base font-bold text-[#006a61] mb-6 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-[#006a61]/10 flex items-center justify-center"><FiCheck size={18} /></div> Strengths
                                    </h3>
                                    <ul className="space-y-4">
                                        {analysis.strengths.map((s, i) => (
                                            <li key={i} className="text-sm text-[#464555] font-medium flex items-start gap-3">
                                                <span className="text-[#006a61] mt-1 shrink-0">•</span> <span>{s}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Weaknesses */}
                                <div className="glass-card rounded-[24px] p-8 neomorphic-hover cursor-default border-t-4 border-t-[#F5A623]">
                                    <h3 className="text-base font-bold text-[#F5A623] mb-6 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-[#F5A623]/10 flex items-center justify-center"><FiAlertCircle size={18} /></div> Areas to Improve
                                    </h3>
                                    <ul className="space-y-4">
                                        {analysis.weaknesses.map((w, i) => (
                                            <li key={i} className="text-sm text-[#464555] font-medium flex items-start gap-3">
                                                <span className="text-[#F5A623] mt-1 shrink-0">•</span> <span>{w}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Suggestions */}
                            <div className="glass-card rounded-[24px] p-8 neomorphic-hover cursor-default">
                                <h3 className="text-base font-bold text-[#3525cd] mb-6 flex items-center gap-2">
                                    <span className="text-2xl">💡</span> Suggestions
                                </h3>
                                <div className="space-y-4">
                                    {analysis.suggestions.map((s, i) => (
                                        <div key={i} className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm flex items-start gap-3">
                                            <span className="font-bold text-[#3525cd]">{i + 1}.</span>
                                            <span className="text-sm text-[#464555] font-medium leading-relaxed">{s}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Keywords */}
                            <div className="glass-card rounded-[24px] p-8 mb-10 neomorphic-hover cursor-default">
                                <h3 className="text-base font-bold text-[#111c2d] mb-6 flex items-center gap-2">
                                    <span className="text-xl">🔑</span> Relevant Keywords
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.keywords.map((k, i) => (
                                        <span key={i} className="px-4 py-2 rounded-full text-xs font-bold bg-[#3525cd]/5 text-[#3525cd] border border-[#3525cd]/20">
                                            {k}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
