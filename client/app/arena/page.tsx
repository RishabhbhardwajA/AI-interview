"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    FiAward,
    FiTrendingUp,
    FiClock,
    FiZap,
    FiUsers,
    FiChevronRight,
    FiStar,
    FiTarget,
    FiBarChart2,
    FiGrid, FiPlay, FiFileText, FiBriefcase, FiSettings
} from "react-icons/fi";

interface ChallengeData {
    _id: string;
    title: string;
    description: string;
    category: string;
    difficulty: number;
    type: string;
    totalParticipants: number;
    activeFrom: string;
    activeTo: string;
    questions: { question: string }[];
    userAttempt: {
        status: string;
        totalScore: number;
        percentage: number;
        rank: number;
    } | null;
}

interface UserStatsData {
    totalPoints: number;
    currentRank: string;
    currentStreak: number;
    longestStreak: number;
    challengesCompleted: number;
    challengesByCategory: {
        technical: number;
        hr: number;
        aptitude: number;
        domainSpecific: number;
    };
    badges: { id: string; name: string; icon: string }[];
}

const CATEGORIES = [
    { id: "all", label: "All", icon: "🏟️" },
    { id: "technical", label: "Technical", icon: "🧠" },
    { id: "hr", label: "HR", icon: "💬" },
    { id: "aptitude", label: "Aptitude", icon: "🧮" },
    { id: "domain-specific", label: "Domain", icon: "🎯" },
];

const RANK_ICONS: Record<string, string> = {
    Bronze: "🥉",
    Silver: "🥈",
    Gold: "🥇",
    Platinum: "💎",
    Diamond: "👑",
};

const CATEGORY_COLORS: Record<string, string> = {
    technical: "#3525cd",
    hr: "#006a61",
    aptitude: "#F5A623",
    "domain-specific": "#E53E3E",
};

export default function ArenaPage() {
    const { user, token, isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();
    const [challenges, setChallenges] = useState<ChallengeData[]>([]);
    const [userStats, setUserStats] = useState<UserStatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState("all");

    const fetchData = useCallback(async () => {
        if (!token) return;
        try {
            const catParam = activeCategory !== "all" ? `?category=${activeCategory}` : "";
            const res = await fetch(`/api/arena${catParam}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.challenges) setChallenges(data.challenges);
            if (data.userStats) setUserStats(data.userStats);
        } catch (err) {
            console.error("Failed to fetch arena data:", err);
        } finally {
            setLoading(false);
        }
    }, [token, activeCategory]);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login");
            return;
        }
        if (token) fetchData();
    }, [authLoading, isAuthenticated, token, router, fetchData]);

    const difficultyLabel = (d: number) => ["", "Easy", "Basic", "Intermediate", "Advanced", "Expert"][d] || "";
    const difficultyColor = (d: number) => ["", "#006a61", "#89f5e7", "#F5A623", "#E53E3E", "#92002a"][d] || "#464555";

    const getTimeRemaining = (activeTo: string) => {
        const diff = new Date(activeTo).getTime() - Date.now();
        if (diff <= 0) return "Expired";
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
        return `${hours}h ${mins}m`;
    };

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
                <Link href="/recruiter" className="flex items-center gap-3 px-4 py-3 text-[#464555] hover:text-[#3525cd] hover:bg-[#3525cd]/5 transition-all duration-300 rounded-lg group">
                    <FiBriefcase size={18} />
                    <span className="text-sm">Recruiter</span>
                </Link>
                <Link href="/arena" className="relative flex items-center gap-3 px-4 py-3 text-[#3525cd] font-bold border-l-4 border-[#3525cd] bg-[#3525cd]/5 rounded-r-lg group">
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
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between mb-10 gap-6 glass-card p-6 rounded-3xl">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">
                                🏟️ Peer Challenge Arena
                            </h1>
                            <p className="text-sm text-[#464555]">
                                Compete with peers through AI-generated interview challenges. Earn badges, climb ranks!
                            </p>
                        </div>
                        <Link
                            href="/arena/leaderboard"
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#3525cd] to-[#6C5CE7] text-white text-sm font-bold shadow-lg shadow-[#3525cd]/30 hover:shadow-xl hover:-translate-y-0.5 transition-all w-full md:w-auto justify-center"
                        >
                            <FiBarChart2 size={18} /> Leaderboard
                        </Link>
                    </div>

                    {/* Stats Bar */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
                        <div className="glass-card rounded-[24px] p-6 text-center neomorphic-hover cursor-default">
                            <p className="text-4xl mb-2">{RANK_ICONS[userStats?.currentRank || "Bronze"]}</p>
                            <p className="text-xl font-black">{userStats?.currentRank || "Bronze"}</p>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rank</p>
                        </div>
                        <div className="glass-card rounded-[24px] p-6 text-center neomorphic-hover cursor-default">
                            <div className="w-12 h-12 mx-auto rounded-full bg-[#F5A623]/10 text-[#F5A623] flex items-center justify-center mb-2">
                                <FiStar size={24} />
                            </div>
                            <p className="text-xl font-black">{userStats?.totalPoints || 0}</p>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Points</p>
                        </div>
                        <div className="glass-card rounded-[24px] p-6 text-center neomorphic-hover cursor-default">
                            <div className="w-12 h-12 mx-auto rounded-full bg-[#E53E3E]/10 text-[#E53E3E] flex items-center justify-center mb-2">
                                <FiZap size={24} />
                            </div>
                            <p className="text-xl font-black">{userStats?.currentStreak || 0}🔥</p>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Streak</p>
                        </div>
                        <div className="glass-card rounded-[24px] p-6 text-center neomorphic-hover cursor-default">
                            <div className="w-12 h-12 mx-auto rounded-full bg-[#006a61]/10 text-[#006a61] flex items-center justify-center mb-2">
                                <FiTarget size={24} />
                            </div>
                            <p className="text-xl font-black">{userStats?.challengesCompleted || 0}</p>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Completed</p>
                        </div>
                        <div className="glass-card rounded-[24px] p-6 text-center neomorphic-hover cursor-default col-span-2 md:col-span-1">
                            <div className="w-12 h-12 mx-auto rounded-full bg-[#6C5CE7]/10 text-[#6C5CE7] flex items-center justify-center mb-2">
                                <FiAward size={24} />
                            </div>
                            <p className="text-xl font-black">{userStats?.badges?.length || 0}</p>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Badges</p>
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div className="flex gap-3 mb-8 flex-wrap">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => { setActiveCategory(cat.id); setLoading(true); }}
                                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                                    activeCategory === cat.id
                                        ? 'bg-[#3525cd] text-white shadow-md shadow-[#3525cd]/30 transform scale-105'
                                        : 'glass-card border border-gray-200 text-[#464555] hover:border-[#3525cd]/50 hover:bg-[#3525cd]/5'
                                }`}
                            >
                                {cat.icon} {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Challenges */}
                    {loading ? (
                        <div className="text-center py-20"><div className="spinner-lg mx-auto border-t-[#3525cd]" /></div>
                    ) : challenges.length === 0 ? (
                        <div className="glass-card rounded-[24px] p-16 text-center border-dashed border-2 border-gray-200 bg-white/50">
                            <p className="text-5xl mb-6">🏟️</p>
                            <p className="text-xl font-bold mb-2">No active challenges</p>
                            <p className="text-sm text-[#464555]">New challenges are generated daily. Check back soon!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {challenges.map((challenge) => {
                                const catColor = CATEGORY_COLORS[challenge.category] || "#3525cd";
                                const isCompleted = challenge.userAttempt?.status === "completed";
                                const isInProgress = challenge.userAttempt?.status === "in-progress";

                                return (
                                    <div
                                        key={challenge._id}
                                        className="glass-card rounded-[24px] p-6 relative overflow-hidden cursor-pointer neomorphic-hover group"
                                        onClick={() => router.push(`/arena/challenge/${challenge._id}`)}
                                        style={{ borderTop: `4px solid ${catColor}` }}
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-20 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

                                        {/* Type badge */}
                                        <div className="flex justify-between items-center mb-4 relative z-10">
                                            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider
                                                ${challenge.type === "daily" ? "bg-[#3525cd]/10 text-[#3525cd]" : "bg-[#006a61]/10 text-[#006a61]"}`}>
                                                {challenge.type === "daily" ? "⚡ Daily" : "📅 Weekly"}
                                            </span>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                                                <FiClock size={14} className={challenge.type === "daily" ? "text-[#3525cd]" : "text-[#006a61]"} /> {getTimeRemaining(challenge.activeTo)}
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-bold mb-2 relative z-10">
                                            {challenge.title}
                                        </h3>
                                        <p className="text-sm text-[#464555] leading-relaxed mb-6 relative z-10 line-clamp-2 min-h-[40px]">
                                            {challenge.description}
                                        </p>

                                        {/* Meta */}
                                        <div className="flex flex-wrap gap-2 mb-6 relative z-10">
                                            <span className="px-3 py-1 rounded-lg text-xs font-bold" style={{ background: `${catColor}15`, color: catColor }}>
                                                {challenge.category}
                                            </span>
                                            <span className="px-3 py-1 rounded-lg text-xs font-bold" style={{ background: `${difficultyColor(challenge.difficulty)}15`, color: difficultyColor(challenge.difficulty) }}>
                                                {difficultyLabel(challenge.difficulty)}
                                            </span>
                                            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 flex items-center gap-1">
                                                <FiUsers size={12} /> {challenge.totalParticipants}
                                            </span>
                                        </div>

                                        {/* Status / CTA */}
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 relative z-10">
                                            {isCompleted ? (
                                                <div className="flex items-center gap-2 text-sm font-bold text-[#006a61]">
                                                    <span className="w-6 h-6 rounded-full bg-[#006a61]/10 flex items-center justify-center">✅</span> 
                                                    {challenge.userAttempt!.percentage}% — Rank #{challenge.userAttempt!.rank}
                                                </div>
                                            ) : isInProgress ? (
                                                <span className="text-sm font-bold text-[#F5A623] flex items-center gap-2">
                                                    <div className="spinner border-t-[#F5A623] w-4 h-4"></div> In Progress
                                                </span>
                                            ) : (
                                                <span className="text-sm font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform" style={{ color: catColor }}>
                                                    Start Challenge <FiChevronRight size={16} />
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
