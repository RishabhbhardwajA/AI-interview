"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiAward, FiZap, FiTarget } from "react-icons/fi";

interface LeaderboardEntry {
    rank: number;
    userId: string;
    name: string;
    points: number;
    currentRank: string;
    rankIcon: string;
    badges: number;
    streak: number;
    challengesCompleted: number;
    isCurrentUser: boolean;
}

const PERIODS = [
    { id: "all", label: "All-Time" },
    { id: "weekly", label: "This Week" },
    { id: "monthly", label: "This Month" },
];

export default function LeaderboardPage() {
    const { token, isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [currentUserPosition, setCurrentUserPosition] = useState<LeaderboardEntry | null>(null);
    const [period, setPeriod] = useState("all");
    const [loading, setLoading] = useState(true);

    const fetchLeaderboard = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/arena/leaderboard?period=${period}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.leaderboard) setLeaderboard(data.leaderboard);
            if (data.currentUserPosition) setCurrentUserPosition(data.currentUserPosition);
            else setCurrentUserPosition(null);
        } catch (err) {
            console.error("Failed to fetch leaderboard:", err);
        } finally {
            setLoading(false);
        }
    }, [token, period]);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login");
            return;
        }
        if (token) fetchLeaderboard();
    }, [authLoading, isAuthenticated, token, router, fetchLeaderboard]);

    if (authLoading) {
        return (
            <div className="min-h-[calc(100vh-72px)] bg-[#F8FAFC] flex items-center justify-center">
                <div className="spinner-lg spinner border-t-[#3525cd]" />
            </div>
        );
    }

    const medalColors = ["", "#F5A623", "#A0AEC0", "#CD7F32"];

    return (
        <div className="min-h-[calc(100vh-72px)] bg-[#F8FAFC] p-6 md:p-10 text-[#111c2d]">
            <div className="fade-in max-w-[800px] mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/arena" className="p-2 rounded-xl bg-white border border-gray-200 text-[#464555] hover:text-[#3525cd] hover:border-[#3525cd]/30 transition-all shadow-sm">
                        <FiArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-[#111c2d] flex items-center gap-2">
                            🏆 Leaderboard
                        </h1>
                        <p className="text-sm text-gray-500 font-medium">See how you stack up against your peers</p>
                    </div>
                </div>

                {/* Period tabs */}
                <div className="flex gap-2 mb-8 p-1 glass-card rounded-2xl w-fit">
                    {PERIODS.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setPeriod(p.id)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                period === p.id
                                    ? "bg-[#3525cd] text-white shadow-md shadow-[#3525cd]/20"
                                    : "text-[#464555] hover:bg-gray-50"
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                {/* Leaderboard Content */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="spinner border-t-[#3525cd] mx-auto" />
                    </div>
                ) : leaderboard.length === 0 ? (
                    <div className="glass-card rounded-[24px] p-12 text-center">
                        <p className="text-5xl mb-4">🏆</p>
                        <p className="text-xl font-bold text-[#111c2d] mb-2">No rankings yet</p>
                        <p className="text-sm text-gray-500 font-medium mb-8">Complete challenges to appear on the leaderboard!</p>
                        <Link href="/arena" className="px-6 py-3 rounded-xl font-bold text-white bg-[#3525cd] hover:bg-[#281a9c] transition-all shadow-lg shadow-[#3525cd]/30 inline-block">
                            Go to Arena
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Top 3 podium */}
                        {leaderboard.length >= 3 && (
                            <div className="grid grid-cols-3 gap-4 mb-8 items-end">
                                {[1, 0, 2].map((idx) => {
                                    const entry = leaderboard[idx];
                                    if (!entry) return null;
                                    const isFirst = idx === 0;
                                    return (
                                        <div
                                            key={entry.userId}
                                            className={`glass-card rounded-[24px] p-6 text-center transition-transform hover:-translate-y-1 ${isFirst ? 'mb-4 shadow-xl border-[#3525cd]/20' : 'shadow-md border-white/50'}`}
                                            style={{
                                                order: idx === 1 ? 1 : idx === 0 ? 2 : 3,
                                                background: entry.isCurrentUser ? (isFirst ? "rgba(53, 37, 205, 0.05)" : "rgba(255, 255, 255, 0.8)") : undefined,
                                                borderColor: entry.isCurrentUser ? "#3525cd" : undefined
                                            }}
                                        >
                                            <div className="relative mb-3">
                                                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl shadow-lg border-2 ${isFirst ? 'w-20 h-20 text-4xl border-[#F5A623] bg-[#F5A623]/10' : idx === 1 ? 'border-[#A0AEC0] bg-[#A0AEC0]/10' : 'border-[#CD7F32] bg-[#CD7F32]/10'}`}>
                                                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                                                </div>
                                            </div>
                                            <p className={`font-bold text-[#111c2d] truncate mb-1 ${isFirst ? 'text-lg' : 'text-sm'}`}>
                                                {entry.name}
                                            </p>
                                            <p className={`font-black mb-3 ${isFirst ? 'text-2xl text-[#3525cd]' : 'text-xl text-gray-700'}`}>
                                                {entry.points}
                                            </p>
                                            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-gray-500 bg-gray-50 py-1.5 px-2 rounded-lg">
                                                <span>{entry.rankIcon}</span>
                                                <span className="flex items-center gap-1 text-[#FF6B4A]"><FiZap size={10} /> {entry.streak}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Rest of leaderboard */}
                        <div className="flex flex-col gap-3">
                            {leaderboard.slice(leaderboard.length >= 3 ? 3 : 0).map((entry) => (
                                <div
                                    key={entry.userId}
                                    className={`glass-card p-4 rounded-2xl flex items-center justify-between transition-all hover:bg-white/80 ${entry.isCurrentUser ? 'border-[#3525cd] bg-[#3525cd]/5 shadow-md shadow-[#3525cd]/10' : ''}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${entry.isCurrentUser ? 'bg-[#3525cd] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                            {entry.rank}
                                        </span>
                                        <div>
                                            <p className="text-sm font-bold text-[#111c2d]">
                                                {entry.name} {entry.isCurrentUser && <span className="text-xs text-[#3525cd] ml-1 bg-[#3525cd]/10 px-2 py-0.5 rounded-full">You</span>}
                                            </p>
                                            <div className="flex items-center gap-3 text-[11px] font-semibold text-gray-500 mt-1">
                                                <span className="flex items-center gap-1">{entry.rankIcon} {entry.currentRank}</span>
                                                <span className="flex items-center gap-1 text-[#6C5CE7]"><FiAward size={10} /> {entry.badges}</span>
                                                <span className="flex items-center gap-1 text-[#FF6B4A]"><FiZap size={10} /> {entry.streak}</span>
                                                <span className="flex items-center gap-1 text-[#006a61]"><FiTarget size={10} /> {entry.challengesCompleted}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-black text-[#111c2d]">{entry.points}</span>
                                        <span className="text-xs font-bold text-gray-400 ml-1">pts</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Current user position if not in top list */}
                        {currentUserPosition && (
                            <div className="mt-8">
                                <div className="flex items-center justify-center gap-4 mb-4">
                                    <div className="h-px bg-gray-200 flex-1"></div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your Position</p>
                                    <div className="h-px bg-gray-200 flex-1"></div>
                                </div>
                                <div className="glass-card p-4 rounded-2xl flex items-center justify-between border-2 border-[#3525cd] bg-[#3525cd]/5 shadow-lg shadow-[#3525cd]/20">
                                    <div className="flex items-center gap-4">
                                        <span className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black bg-[#3525cd] text-white">
                                            {currentUserPosition.rank}
                                        </span>
                                        <div>
                                            <p className="text-sm font-bold text-[#111c2d]">
                                                {currentUserPosition.name} <span className="text-xs text-[#3525cd] ml-1 bg-[#3525cd]/10 px-2 py-0.5 rounded-full">You</span>
                                            </p>
                                            <div className="flex items-center gap-3 text-[11px] font-semibold text-gray-500 mt-1">
                                                <span className="flex items-center gap-1">{currentUserPosition.rankIcon} {currentUserPosition.currentRank}</span>
                                                <span className="flex items-center gap-1 text-[#FF6B4A]"><FiZap size={10} /> {currentUserPosition.streak}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-black text-[#111c2d]">{currentUserPosition.points}</span>
                                        <span className="text-xs font-bold text-gray-400 ml-1">pts</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
