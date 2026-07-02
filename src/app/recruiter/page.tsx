"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
    FiArrowRight,
    FiSkipForward,
    FiClock,
    FiArrowUp,
    FiArrowDown,
    FiMinus,
    FiCheck,
    FiStar,
    FiTarget,
    FiAward,
    FiGrid, FiPlay, FiFileText, FiBriefcase, FiSettings
} from "react-icons/fi";
import Link from "next/link";

interface CompanyCard {
    id: string;
    name: string;
    logo: string;
    color: string;
    description: string;
    focusAreas: string[];
    difficultyRange: { min: number; max: number };
    rounds: { name: string; type: string; description: string }[];
}

const COMPANIES: CompanyCard[] = [
    {
        id: "google",
        name: "Google",
        logo: "🔍",
        color: "#4285F4",
        description: "Algorithmic thinking, system design at scale, Googleyness",
        focusAreas: ["Algorithms", "System Design", "Scalability", "Code Quality"],
        difficultyRange: { min: 3, max: 5 },
        rounds: [
            { name: "Phone Screen", type: "coding", description: "DSA problem" },
            { name: "Technical 1", type: "coding", description: "Medium-hard coding" },
            { name: "Technical 2", type: "coding", description: "Hard algorithmic" },
            { name: "System Design", type: "system-design", description: "Distributed systems" },
            { name: "Behavioral", type: "behavioral", description: "Googleyness" },
        ],
    },
    {
        id: "amazon",
        name: "Amazon",
        logo: "📦",
        color: "#FF9900",
        description: "Leadership Principles, customer obsession, practical problem-solving",
        focusAreas: ["Leadership Principles", "STAR Method", "System Design", "Problem Solving"],
        difficultyRange: { min: 2, max: 5 },
        rounds: [
            { name: "Online Assessment", type: "coding", description: "2 problems + work sim" },
            { name: "Phone Screen", type: "technical", description: "Coding + LP" },
            { name: "Loop 1", type: "technical", description: "Coding + LP" },
            { name: "Loop 2", type: "system-design", description: "Design + LP" },
            { name: "Bar Raiser", type: "behavioral", description: "Deep LP assessment" },
        ],
    },
    {
        id: "microsoft",
        name: "Microsoft",
        logo: "🪟",
        color: "#00A4EF",
        description: "Collaborative problem-solving, growth mindset, technical depth",
        focusAreas: ["Collaboration", "Growth Mindset", "Technical Depth", "Inclusive Design"],
        difficultyRange: { min: 2, max: 4 },
        rounds: [
            { name: "Phone Screen", type: "coding", description: "Coding + discussion" },
            { name: "Technical 1", type: "coding", description: "Problem solving" },
            { name: "Technical 2", type: "system-design", description: "Real-world design" },
            { name: "Behavioral", type: "behavioral", description: "Growth mindset" },
            { name: "AA Round", type: "hr", description: "Final decision" },
        ],
    },
    {
        id: "tcs",
        name: "TCS",
        logo: "🏢",
        color: "#6C5CE7",
        description: "CS fundamentals, aptitude, structured communication",
        focusAreas: ["CS Fundamentals", "Aptitude", "SQL", "Communication"],
        difficultyRange: { min: 1, max: 3 },
        rounds: [
            { name: "Online Test", type: "aptitude", description: "Aptitude + reasoning" },
            { name: "Technical", type: "technical", description: "CS fundamentals" },
            { name: "Managerial", type: "behavioral", description: "Situational Qs" },
            { name: "HR", type: "hr", description: "Communication" },
        ],
    },
    {
        id: "infosys",
        name: "Infosys",
        logo: "💠",
        color: "#007CC3",
        description: "Logical reasoning, core CS knowledge, communication skills",
        focusAreas: ["Logical Reasoning", "Programming", "DBMS", "Communication"],
        difficultyRange: { min: 1, max: 3 },
        rounds: [
            { name: "Online Assessment", type: "aptitude", description: "Reasoning + verbal" },
            { name: "Technical", type: "technical", description: "Programming + CS" },
            { name: "HR", type: "hr", description: "Communication + fit" },
        ],
    },
];

const TOPICS = [
    "React & Frontend",
    "Node.js & Backend",
    "Data Structures & Algorithms",
    "System Design",
    "Database & SQL",
    "JavaScript Fundamentals",
    "OOPs Concepts",
    "Operating Systems",
    "Networking",
    "General Technical",
];

export default function RecruiterPage() {
    const { user, token, isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();

    const [phase, setPhase] = useState<"select" | "setup" | "active" | "completed">("select");
    const [selectedCompany, setSelectedCompany] = useState<CompanyCard | null>(null);
    const [customCompany, setCustomCompany] = useState("");
    const [selectedTopic, setSelectedTopic] = useState("");
    const [questionCount, setQuestionCount] = useState(10);
    const [interviewId, setInterviewId] = useState("");
    const [currentQuestion, setCurrentQuestion] = useState("");
    const [currentDifficulty, setCurrentDifficulty] = useState(2);
    const [questionNumber, setQuestionNumber] = useState(1);
    const [totalQuestions, setTotalQuestions] = useState(10);
    const [answer, setAnswer] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [starting, setStarting] = useState(false);
    const [startError, setStartError] = useState("");
    const [feedback, setFeedback] = useState<{
        score: number;
        feedback: string;
        difficultyAdjustment: string;
        keyPointsCovered: string[];
        areasToImprove: string[];
        meetsCompanyBar?: boolean;
        companySpecificFeedback?: string;
    } | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [timer, setTimer] = useState(0);
    const [reportData, setReportData] = useState<Record<string, unknown> | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) router.push("/login");
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        if (phase === "active") {
            timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
            return () => {
                if (timerRef.current) clearInterval(timerRef.current);
            };
        }
    }, [phase, questionNumber]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
    const difficultyLabel = (d: number) => ["", "Easy", "Basic", "Intermediate", "Advanced", "Expert"][d] || "";
    const difficultyColor = (d: number) => ["", "#34C759", "#7BC95A", "#F5A623", "#F07C3E", "#E53E3E"][d] || "#3525cd";

    const companyName = selectedCompany?.name || customCompany;
    const companyColor = selectedCompany?.color || "#3525cd";

    const handleSelectCompany = (company: CompanyCard) => {
        setSelectedCompany(company);
        setCustomCompany("");
        setPhase("setup");
    };

    const handleCustomCompany = () => {
        if (!customCompany.trim()) return;
        setSelectedCompany(null);
        setPhase("setup");
    };

    const startInterview = useCallback(async () => {
        const company = selectedCompany?.id || customCompany;
        if (!company || !token) return;
        setStarting(true);
        setStartError("");
        try {
            const res = await fetch("/api/recruiter", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    action: "start",
                    company,
                    topic: selectedTopic,
                    totalQuestions: questionCount,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setInterviewId(data.interview.id);
            setCurrentQuestion(data.interview.currentQuestion);
            setCurrentDifficulty(data.interview.currentDifficulty);
            setQuestionNumber(data.interview.questionNumber);
            setTotalQuestions(data.interview.totalQuestions);
            setPhase("active");
            setTimer(0);
        } catch (err: unknown) {
            console.error(err);
            setStartError(err instanceof Error ? err.message : "Failed to start interview.");
        } finally {
            setStarting(false);
        }
    }, [selectedCompany, customCompany, token, selectedTopic, questionCount]);

    const submitAnswer = useCallback(
        async (skipped = false) => {
            if (submitting) return;
            if (!skipped && answer.trim().length < 5) return;
            setSubmitting(true);
            setShowFeedback(false);

            try {
                const res = await fetch("/api/recruiter", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        action: "answer",
                        interviewId,
                        answer: skipped ? "" : answer,
                        timeTaken: timer,
                        skipped,
                    }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

                setFeedback(data.evaluation);
                setShowFeedback(true);

                if (data.completed) {
                    setPhase("completed");
                    setReportData(data.report);
                    if (timerRef.current) clearInterval(timerRef.current);
                } else {
                    setTimeout(() => {
                        setCurrentQuestion(data.nextQuestion);
                        setCurrentDifficulty(data.currentDifficulty);
                        setQuestionNumber(data.questionNumber);
                        setAnswer("");
                        setTimer(0);
                        setShowFeedback(false);
                    }, 3500);
                }
            } catch (err) {
                console.error(err);
                alert("Failed to submit answer. Please try again.");
            } finally {
                setSubmitting(false);
            }
        },
        [submitting, answer, token, interviewId, timer]
    );

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="spinner-lg spinner" />
            </div>
        );
    }

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
                <Link href="/recruiter" className="relative flex items-center gap-3 px-4 py-3 text-[#3525cd] font-bold border-l-4 border-[#3525cd] bg-[#3525cd]/5 rounded-r-lg group">
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

    // ========== COMPANY SELECTION PHASE ==========
    if (phase === "select") {
        return (
            <div className="flex h-screen overflow-hidden bg-[#F8FAFC] text-[#111c2d]">
                <Sidebar />
                <main className="flex-1 ml-0 md:ml-64 h-full overflow-y-auto w-full pt-[72px] px-4 md:px-8 py-8">
                    <div className="fade-in max-w-[1000px] mx-auto mt-4">
                        <header className="mb-8">
                            <h1 className="text-3xl font-bold mb-2">🏢 AI Recruiter Simulator</h1>
                            <p className="text-sm text-[#464555] leading-relaxed">
                                Select a company to experience their real interview process. The AI adapts questions, difficulty, and evaluation to match each company's hiring standards.
                            </p>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                            {COMPANIES.map((company) => (
                                <button
                                    key={company.id}
                                    onClick={() => handleSelectCompany(company)}
                                    className="glass-card rounded-[24px] p-6 text-left relative overflow-hidden group transition-all duration-300"
                                    style={{ borderTop: `4px solid ${company.color}` }}
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-20 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none group-hover:scale-150 transition-transform duration-500"></div>
                                    
                                    <div className="flex items-center gap-4 mb-4 relative z-10">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-3xl bg-white shadow-sm">
                                            {company.logo}
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-[#111c2d]">{company.name}</p>
                                            <p className="text-xs font-semibold text-gray-500">
                                                Difficulty: {company.difficultyRange.min}–{company.difficultyRange.max}/5
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-[#464555] leading-relaxed mb-6 relative z-10 min-h-[42px] line-clamp-2">
                                        {company.description}
                                    </p>
                                    <div className="flex flex-wrap gap-2 relative z-10 mb-4">
                                        {company.focusAreas.slice(0, 3).map((area) => (
                                            <span
                                                key={area}
                                                className="px-3 py-1 rounded-lg text-xs font-bold"
                                                style={{ background: `${company.color}15`, color: company.color }}
                                            >
                                                {area}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider relative z-10">
                                        {company.rounds.length} interview rounds
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Custom Company */}
                        <div className="glass-card rounded-[24px] p-8 neomorphic-hover cursor-default">
                            <p className="text-base font-bold mb-4 flex items-center gap-2">
                                <span>🔧</span> Or enter any company name
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <input
                                    type="text"
                                    placeholder="e.g., Flipkart, Uber, Wipro..."
                                    value={customCompany}
                                    onChange={(e) => setCustomCompany(e.target.value)}
                                    className="flex-1 px-6 py-4 rounded-xl border border-gray-200 bg-white text-base text-[#111c2d] focus:outline-none focus:ring-2 focus:ring-[#3525cd]/30 placeholder-gray-400"
                                    onKeyDown={(e) => e.key === "Enter" && handleCustomCompany()}
                                />
                                <button
                                    className="px-8 py-4 rounded-xl font-bold bg-[#3525cd] text-white hover:bg-[#281a9c] transition-colors shadow-lg shadow-[#3525cd]/20 flex items-center justify-center gap-2 disabled:opacity-50 sm:w-auto w-full"
                                    onClick={handleCustomCompany}
                                    disabled={!customCompany.trim()}
                                >
                                    Go <FiArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // ========== SETUP PHASE ==========
    if (phase === "setup") {
        return (
            <div className="flex h-screen overflow-hidden bg-[#F8FAFC] text-[#111c2d]">
                <Sidebar />
                <main className="flex-1 ml-0 md:ml-64 h-full overflow-y-auto w-full pt-[72px] px-4 md:px-8 py-8">
                    <div className="fade-in max-w-[800px] mx-auto mt-4">
                        <button
                            onClick={() => { setPhase("select"); setSelectedCompany(null); setCustomCompany(""); }}
                            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#3525cd] transition-colors mb-6"
                        >
                            ← Back to companies
                        </button>

                        <div className="flex items-center gap-6 mb-8">
                            <div className="w-20 h-20 rounded-[24px] bg-white shadow-sm flex items-center justify-center text-5xl">
                                {selectedCompany?.logo || "🏢"}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-2">{companyName} Interview</h1>
                                <p className="text-sm text-[#464555]">Configure your simulated interview</p>
                            </div>
                        </div>

                        {startError && (
                            <div className="glass-card mb-6 p-4 border border-[#E53E3E] bg-[#E53E3E]/5 text-[#E53E3E] rounded-xl flex flex-col gap-1">
                                <strong className="font-bold">Error:</strong>
                                <span className="text-sm">{startError}</span>
                            </div>
                        )}

                        {/* Company info card */}
                        {selectedCompany && (
                            <div className="glass-card rounded-[24px] p-6 mb-8 border-l-4" style={{ borderLeftColor: companyColor }}>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Interview Rounds</p>
                                <div className="flex flex-wrap gap-3">
                                    {selectedCompany.rounds.map((round, i) => (
                                        <div
                                            key={i}
                                            className="px-4 py-2 rounded-xl flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2"
                                            style={{ background: `${companyColor}0A`, border: `1px solid ${companyColor}20` }}
                                        >
                                            <span className="font-bold text-sm">{round.name}</span>
                                            <span className="text-gray-500 text-xs sm:text-sm">— {round.description}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="glass-card rounded-[24px] p-8">
                            <label className="block text-sm font-bold mb-4 uppercase tracking-wider text-[#464555]">
                                Select Focus Topic <span className="text-xs font-medium text-gray-400 normal-case">(optional)</span>
                            </label>
                            <div className="flex flex-wrap gap-3 mb-10">
                                {TOPICS.map((topic) => (
                                    <button
                                        key={topic}
                                        onClick={() => setSelectedTopic(selectedTopic === topic ? "" : topic)}
                                        className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                                            selectedTopic === topic
                                                ? 'text-white shadow-md transform scale-105'
                                                : 'bg-white border border-gray-200 text-[#464555] hover:border-gray-300'
                                        }`}
                                        style={selectedTopic === topic ? { background: companyColor, boxShadow: `0 4px 15px ${companyColor}40` } : {}}
                                    >
                                        {topic}
                                    </button>
                                ))}
                            </div>

                            <label className="block text-sm font-bold mb-4 uppercase tracking-wider text-[#464555]">
                                Number of Questions
                            </label>
                            <div className="flex gap-4 mb-10">
                                {[5, 10, 15].map((n) => (
                                    <button
                                        key={n}
                                        onClick={() => setQuestionCount(n)}
                                        className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                                            questionCount === n
                                                ? 'text-white shadow-md transform scale-105'
                                                : 'bg-white border border-gray-200 text-[#464555] hover:border-gray-300'
                                        }`}
                                        style={questionCount === n ? { background: companyColor, boxShadow: `0 4px 15px ${companyColor}40` } : {}}
                                    >
                                        {n} Qs
                                    </button>
                                ))}
                            </div>

                            <button
                                className="w-full py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-3 transition-all duration-300 text-white shadow-lg disabled:opacity-50"
                                disabled={starting}
                                onClick={startInterview}
                                style={{ background: companyColor, boxShadow: `0 8px 25px ${companyColor}40` }}
                            >
                                {starting ? (
                                    <div className="spinner border-t-white" style={{ width: "24px", height: "24px" }} />
                                ) : (
                                    <>
                                        Start {companyName} Interview <FiArrowRight size={22} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // ========== COMPLETED PHASE ==========
    if (phase === "completed" && reportData) {
        const report = reportData as {
            id: string;
            company: string;
            averageScore: number;
            peakDifficulty: number;
            overallMeetsBar: boolean;
            verdict: string;
            passingThreshold: number;
            questions: { score: number; difficulty: number; question: string; feedback: string }[];
            questionsAboveBar: number;
        };

        return (
            <div className="flex h-screen overflow-hidden bg-[#F8FAFC] text-[#111c2d]">
                <Sidebar />
                <main className="flex-1 ml-0 md:ml-64 h-full overflow-y-auto w-full pt-[72px] px-4 md:px-8 py-8">
                    <div className="fade-in max-w-[800px] mx-auto mt-10 text-center">
                        <span className="text-7xl block mb-6 drop-shadow-sm">
                            {report.overallMeetsBar ? "🎉" : "💪"}
                        </span>
                        <h1 className="text-4xl font-bold mb-4">
                            {report.company} Interview Complete
                        </h1>
                        <p className={`text-xl font-bold mb-10 ${report.overallMeetsBar ? "text-[#006a61]" : "text-[#F5A623]"}`}>
                            {report.verdict}
                        </p>

                        {/* Stats grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                            <div className="glass-card rounded-[24px] p-8 neomorphic-hover cursor-default">
                                <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: `${companyColor}15`, color: companyColor }}>
                                    <FiTarget size={24} />
                                </div>
                                <p className="text-4xl font-black mb-1">{report.averageScore.toFixed(1)}<span className="text-sm text-gray-400 font-bold">/10</span></p>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Average Score</p>
                            </div>
                            <div className="glass-card rounded-[24px] p-8 neomorphic-hover cursor-default">
                                <div className="w-12 h-12 rounded-full bg-[#F5A623]/15 text-[#F5A623] mx-auto flex items-center justify-center mb-4">
                                    <FiAward size={24} />
                                </div>
                                <p className="text-2xl font-black mb-1 mt-3">{difficultyLabel(report.peakDifficulty)}</p>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-3">Peak Difficulty</p>
                            </div>
                            <div className="glass-card rounded-[24px] p-8 neomorphic-hover cursor-default">
                                <div className="w-12 h-12 rounded-full bg-[#006a61]/15 text-[#006a61] mx-auto flex items-center justify-center mb-4">
                                    <FiStar size={24} />
                                </div>
                                <p className="text-4xl font-black mb-1">
                                    {report.questionsAboveBar}<span className="text-sm text-gray-400 font-bold">/{report.questions.length}</span>
                                </p>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Above Bar</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                className="px-8 py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                                onClick={() => router.push(`/report/${report.id}`)}
                                style={{ background: companyColor, boxShadow: `0 8px 25px ${companyColor}40` }}
                            >
                                View Full Report <FiArrowRight size={20} />
                            </button>
                            <button
                                className="px-8 py-4 rounded-xl font-bold bg-white border border-gray-200 text-[#464555] hover:bg-gray-50 transition-colors shadow-sm"
                                onClick={() => {
                                    setPhase("select");
                                    setSelectedCompany(null);
                                    setCustomCompany("");
                                    setFeedback(null);
                                    setShowFeedback(false);
                                    setReportData(null);
                                }}
                            >
                                Try Another Company
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // ========== ACTIVE INTERVIEW PHASE ==========
    return (
        <div className="flex h-screen overflow-hidden bg-[#F8FAFC] text-[#111c2d]">
            <Sidebar />
            <main className="flex-1 ml-0 md:ml-64 h-full overflow-y-auto w-full pt-[72px] px-4 md:px-8 py-8">
                <div className="fade-in max-w-[1100px] mx-auto mt-4">
                    {/* Company header */}
                    <div className="flex items-center gap-4 mb-8 glass-card p-4 rounded-2xl w-fit pr-6">
                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-2xl">
                            {selectedCompany?.logo || "🏢"}
                        </div>
                        <span className="text-xl font-bold" style={{ color: companyColor }}>{companyName} Interview</span>
                    </div>

                    {/* Top Bar */}
                    <div className="flex items-center justify-between mb-8 glass-card p-4 rounded-2xl">
                        <div className="flex-1 px-4">
                            <div className="flex items-center gap-4 mb-2">
                                <span className="text-sm font-bold text-[#464555] uppercase tracking-wider">
                                    Question {questionNumber} of {totalQuestions}
                                </span>
                                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider" style={{ background: `${difficultyColor(currentDifficulty)}15`, color: difficultyColor(currentDifficulty) }}>
                                    {difficultyLabel(currentDifficulty)}
                                </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full transition-all duration-500 ease-out" style={{ width: `${(questionNumber / totalQuestions) * 100}%`, background: companyColor }} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-gray-100 shadow-sm ml-6">
                            <FiClock size={20} className="text-[#F5A623]" />
                            <span className="text-lg font-bold font-mono tracking-widest">{formatTime(timer)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Question & Answer */}
                        <div className="lg:col-span-2 flex flex-col gap-4">
                            <div className="glass-card rounded-2xl p-8 shadow-sm border-l-4" style={{ borderLeftColor: companyColor }}>
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 text-white" style={{ background: companyColor }}>
                                        <span className="font-bold text-sm">Q</span>
                                    </div>
                                    <p className="text-xl font-semibold leading-relaxed">{currentQuestion}</p>
                                </div>
                            </div>

                            <div className="glass-card rounded-2xl p-2 relative">
                                <textarea
                                    className="w-full bg-transparent border-none focus:ring-0 resize-none p-6 text-lg placeholder-gray-400"
                                    placeholder="Type your answer here..."
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    disabled={submitting}
                                    style={{ minHeight: "240px", outline: 'none' }}
                                />
                                <div className="absolute bottom-4 right-6 text-xs font-semibold text-gray-400">
                                    {answer.length} characters
                                </div>
                            </div>

                            <div className="flex gap-4 mt-2">
                                <button
                                    className="px-6 py-4 rounded-xl font-bold bg-white border border-gray-200 text-[#464555] hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                                    onClick={() => submitAnswer(true)}
                                    disabled={submitting}
                                >
                                    <FiSkipForward size={18} /> Skip
                                </button>
                                <button
                                    className="flex-1 py-4 rounded-xl font-bold text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:bg-gray-300 disabled:shadow-none"
                                    onClick={() => submitAnswer(false)}
                                    disabled={submitting || answer.trim().length < 5}
                                    style={{ background: companyColor, boxShadow: `0 8px 25px ${companyColor}40` }}
                                >
                                    {submitting ? (
                                        <div className="spinner border-t-white" style={{ width: "20px", height: "20px" }} />
                                    ) : (
                                        <>
                                            Submit Answer <FiCheck size={20} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Feedback Panel */}
                        <div className="lg:col-span-1">
                            {showFeedback && feedback ? (
                                <div className="glass-card rounded-2xl p-6 slide-up h-full bg-gradient-to-br from-white to-gray-50/50">
                                    <p className="text-xs font-bold uppercase tracking-wider mb-6" style={{ color: companyColor }}>
                                        {companyName} Evaluation
                                    </p>

                                    {/* Score circle */}
                                    <div className="flex items-center gap-6 mb-8">
                                        <div
                                            className={`w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center bg-white shadow-sm shrink-0
                                                ${feedback.score >= 7 ? "border-[#006a61] text-[#006a61]" : feedback.score >= 4 ? "border-[#F5A623] text-[#F5A623]" : "border-[#E53E3E] text-[#E53E3E]"}`}
                                        >
                                            <span className="text-3xl font-black">{feedback.score}</span>
                                            <span className="text-xs font-bold opacity-50">/10</span>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-1.5">
                                                {feedback.difficultyAdjustment === "increase" && <><FiArrowUp size={18} className="text-[#006a61]" /><span className="text-[#006a61] font-bold text-sm">Difficulty ↑</span></>}
                                                {feedback.difficultyAdjustment === "decrease" && <><FiArrowDown size={18} className="text-[#E53E3E]" /><span className="text-[#E53E3E] font-bold text-sm">Difficulty ↓</span></>}
                                                {feedback.difficultyAdjustment === "maintain" && <><FiMinus size={18} className="text-[#F5A623]" /><span className="text-[#F5A623] font-bold text-sm">Maintained</span></>}
                                            </div>
                                            {/* Meets company bar indicator */}
                                            {feedback.meetsCompanyBar !== undefined && (
                                                <div className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 w-fit
                                                    ${feedback.meetsCompanyBar ? "bg-[#006a61]/10 text-[#006a61]" : "bg-[#E53E3E]/10 text-[#E53E3E]"}`}>
                                                    {feedback.meetsCompanyBar ? "✅ Meets bar" : "⚠️ Below bar"}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white/60 backdrop-blur-md rounded-xl p-4 mb-6 border border-gray-100 shadow-sm">
                                        <p className="text-sm text-[#111c2d] leading-relaxed font-medium">{feedback.feedback}</p>
                                    </div>

                                    {/* Company-specific feedback */}
                                    {feedback.companySpecificFeedback && (
                                        <div className="p-4 rounded-xl mb-6" style={{ background: `${companyColor}0A`, border: `1px solid ${companyColor}20` }}>
                                            <p className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: companyColor }}>
                                                <FiTarget size={14} /> {companyName} Insight
                                            </p>
                                            <p className="text-xs text-[#464555] font-medium leading-relaxed">{feedback.companySpecificFeedback}</p>
                                        </div>
                                    )}

                                    {feedback.keyPointsCovered.length > 0 && (
                                        <div className="mb-4">
                                            <p className="text-xs font-bold text-[#006a61] uppercase tracking-wider mb-2 flex items-center gap-2">✓ Key Points</p>
                                            <ul className="space-y-1">
                                                {feedback.keyPointsCovered.map((p, i) => (
                                                    <li key={i} className="text-xs font-medium text-[#464555] flex items-start gap-2">
                                                        <span className="text-[#006a61] mt-0.5">•</span> {p}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {feedback.areasToImprove.length > 0 && (
                                        <div>
                                            <p className="text-xs font-bold text-[#F5A623] uppercase tracking-wider mb-2 flex items-center gap-2">△ Improve</p>
                                            <ul className="space-y-1">
                                                {feedback.areasToImprove.map((a, i) => (
                                                    <li key={i} className="text-xs font-medium text-[#464555] flex items-start gap-2">
                                                        <span className="text-[#F5A623] mt-0.5">•</span> {a}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="glass-card rounded-2xl p-8 h-full flex flex-col items-center justify-center text-center border-dashed border-2 border-gray-200 bg-gray-50/50">
                                    <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mb-6 text-4xl">
                                        {selectedCompany?.logo || "🏢"}
                                    </div>
                                    <p className="text-sm text-[#464555] font-medium leading-relaxed max-w-[250px]">
                                        Answer the question to get <strong style={{ color: companyColor }}>{companyName}</strong>-specific feedback and see if you meet their hiring bar.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
