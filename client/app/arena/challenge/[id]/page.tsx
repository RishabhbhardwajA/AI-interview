"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import {
    FiCheck,
    FiClock,
    FiAward,
    FiStar,
    FiArrowRight,
    FiZap,
} from "react-icons/fi";

const CATEGORY_COLORS: Record<string, string> = {
    technical: "#3525cd",
    hr: "#006a61",
    aptitude: "#F5A623",
    "domain-specific": "#E53E3E",
};

const RANK_ICONS: Record<string, string> = {
    Bronze: "🥉", Silver: "🥈", Gold: "🥇", Platinum: "💎", Diamond: "👑",
};

export default function ChallengePage() {
    const { token, isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const challengeId = params.id as string;

    const [phase, setPhase] = useState<"loading" | "active" | "completed">("loading");
    const [challenge, setChallenge] = useState<{
        id: string; title: string; category: string; difficulty: number; questions: string[];
    } | null>(null);
    const [attemptId, setAttemptId] = useState("");
    const [currentQ, setCurrentQ] = useState(0);
    const [totalQs, setTotalQs] = useState(5);
    const [answer, setAnswer] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ score: number; feedback: string } | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [timer, setTimer] = useState(0);
    const [scores, setScores] = useState<number[]>([]);
    const [result, setResult] = useState<{
        totalScore: number; maxScore: number; percentage: number; rank: number;
        pointsEarned: number; newBadges: { name: string; icon: string }[];
        currentRank: string; totalPoints: number; streak: number;
    } | null>(null);
    const [error, setError] = useState("");
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) router.push("/login");
    }, [authLoading, isAuthenticated, router]);

    // Start attempt
    useEffect(() => {
        if (!token || !challengeId) return;
        (async () => {
            try {
                const res = await fetch("/api/arena", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ action: "attempt", challengeId }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

                setChallenge(data.challenge);
                setAttemptId(data.attempt.id);
                setTotalQs(data.challenge.questions.length);

                if (data.attempt.status === "completed") {
                    router.push("/arena");
                    return;
                }

                setCurrentQ(data.attempt.currentQuestion || 0);
                setPhase("active");
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Failed to start challenge.");
            }
        })();
    }, [token, challengeId, router]);

    // Timer
    useEffect(() => {
        if (phase === "active") {
            timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
            return () => { if (timerRef.current) clearInterval(timerRef.current); };
        }
    }, [phase, currentQ]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
    const difficultyLabel = (d: number) => ["", "Easy", "Basic", "Intermediate", "Advanced", "Expert"][d] || "";
    const catColor = CATEGORY_COLORS[challenge?.category || ""] || "#3525cd";

    const submitAnswer = useCallback(async () => {
        if (submitting || answer.trim().length < 5) return;
        setSubmitting(true);
        setShowFeedback(false);

        try {
            const res = await fetch("/api/arena", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    action: "submit",
                    attemptId,
                    questionIndex: currentQ,
                    answer,
                    timeTaken: timer,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setFeedback(data.evaluation);
            setShowFeedback(true);
            setScores((prev) => [...prev, data.evaluation.score]);

            if (data.completed) {
                if (timerRef.current) clearInterval(timerRef.current);
                setResult(data.result);
                setTimeout(() => setPhase("completed"), 2000);
            } else {
                setTimeout(() => {
                    setCurrentQ(currentQ + 1);
                    setAnswer("");
                    setTimer(0);
                    setShowFeedback(false);
                }, 2500);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to submit. Try again.");
        } finally {
            setSubmitting(false);
        }
    }, [submitting, answer, token, attemptId, currentQ, timer]);

    if (authLoading || phase === "loading") {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4">
                {error ? (
                    <div className="text-center fade-in">
                        <p className="text-[#E53E3E] font-bold mb-4">{error}</p>
                        <button className="px-6 py-3 rounded-xl font-bold bg-[#3525cd] text-white hover:bg-[#281a9c] transition-all" onClick={() => router.push("/arena")}>Back to Arena</button>
                    </div>
                ) : (
                    <div className="spinner-lg spinner border-t-[#3525cd]" />
                )}
            </div>
        );
    }

    // ========== COMPLETED ==========
    if (phase === "completed" && result) {
        return (
            <div className="min-h-[calc(100vh-72px)] bg-[#F8FAFC] p-6 md:p-12 text-[#111c2d]">
                <div className="fade-in max-w-[700px] mx-auto text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#3525cd] to-[#6C5CE7] mx-auto flex items-center justify-center text-4xl shadow-xl shadow-[#3525cd]/30 mb-6 relative">
                        🏆
                        <div className="absolute inset-0 rounded-full border-4 border-[#3525cd]/20 animate-ping"></div>
                    </div>
                    
                    <h1 className="text-4xl font-black mb-2 text-[#111c2d]">Challenge Complete!</h1>
                    <p className="text-lg text-gray-500 font-medium mb-10">{challenge?.title}</p>

                    {/* Score Grid */}
                    <div className="glass-card rounded-[24px] p-8 mb-8">
                        <div className="grid grid-cols-3 gap-6">
                            <div className="text-center p-4 bg-white/50 rounded-2xl border border-white">
                                <p className={`text-4xl font-black mb-1 ${result.percentage >= 70 ? 'text-[#34C759]' : result.percentage >= 40 ? 'text-[#F5A623]' : 'text-[#E53E3E]'}`}>
                                    {result.percentage}%
                                </p>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Score ({result.totalScore}/{result.maxScore})</p>
                            </div>
                            <div className="text-center p-4 bg-white/50 rounded-2xl border border-white">
                                <p className="text-4xl font-black text-[#111c2d] mb-1">#{result.rank}</p>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rank</p>
                            </div>
                            <div className="text-center p-4 bg-[#3525cd]/5 rounded-2xl border border-[#3525cd]/10 relative overflow-hidden">
                                <div className="absolute -top-6 -right-6 w-16 h-16 bg-[#F5A623]/20 rounded-full blur-[10px]"></div>
                                <p className="text-4xl font-black text-[#F5A623] mb-1">+{result.pointsEarned}</p>
                                <p className="text-xs font-bold text-[#3525cd] uppercase tracking-wider">Points Earned</p>
                            </div>
                        </div>
                    </div>

                    {/* Per-question scores */}
                    <div className="glass-card rounded-[24px] p-6 mb-8 text-center">
                        <p className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">Per-Question Scores</p>
                        <div className="flex gap-3 justify-center">
                            {scores.map((s, i) => (
                                <div key={i} className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black shadow-sm ${
                                    s >= 7 ? 'bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20' : 
                                    s >= 4 ? 'bg-[#F5A623]/10 text-[#F5A623] border border-[#F5A623]/20' : 
                                    'bg-[#E53E3E]/10 text-[#E53E3E] border border-[#E53E3E]/20'
                                }`}>
                                    {s}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Gamification status */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="glass-card rounded-2xl p-4 flex flex-col items-center">
                            <p className="text-3xl mb-2">{RANK_ICONS[result.currentRank]}</p>
                            <p className="text-sm font-bold text-[#111c2d]">{result.currentRank}</p>
                            <p className="text-xs text-gray-500 font-semibold">{result.totalPoints} pts</p>
                        </div>
                        <div className="glass-card rounded-2xl p-4 flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-[#FF6B4A]/10 text-[#FF6B4A] flex items-center justify-center mb-2">
                                <FiZap size={20} />
                            </div>
                            <p className="text-sm font-bold text-[#111c2d]">{result.streak} Streak</p>
                            <p className="text-xs text-gray-500 font-semibold">Keep it up!</p>
                        </div>
                        <div className="glass-card rounded-2xl p-4 flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-[#6C5CE7]/10 text-[#6C5CE7] flex items-center justify-center mb-2">
                                <FiAward size={20} />
                            </div>
                            <p className="text-sm font-bold text-[#111c2d]">
                                {result.newBadges.length > 0 ? "New Badges!" : "No new badges"}
                            </p>
                            <p className="text-xs text-gray-500 font-semibold">Keep practicing</p>
                        </div>
                    </div>

                    {/* New badges */}
                    {result.newBadges.length > 0 && (
                        <div className="glass-card slide-up rounded-[24px] p-6 mb-10 border-2 border-[#6C5CE7]/30 bg-[#6C5CE7]/5 shadow-lg shadow-[#6C5CE7]/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#6C5CE7]/20 rounded-full blur-[40px]"></div>
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#3525cd]/20 rounded-full blur-[40px]"></div>
                            
                            <p className="text-lg font-black text-[#6C5CE7] mb-4 flex items-center justify-center gap-2">
                                🎉 New Badges Unlocked!
                            </p>
                            <div className="flex gap-4 justify-center">
                                {result.newBadges.map((badge, i) => (
                                    <div key={i} className="text-center p-3 bg-white/60 rounded-xl shadow-sm border border-white">
                                        <p className="text-3xl mb-1">{badge.icon}</p>
                                        <p className="text-xs font-bold text-[#111c2d]">{badge.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4 justify-center">
                        <button className="px-8 py-4 rounded-xl font-bold text-white bg-[#3525cd] hover:bg-[#281a9c] transition-all shadow-lg shadow-[#3525cd]/30 flex items-center gap-2" onClick={() => router.push("/arena")}>
                            Back to Arena <FiArrowRight size={18} />
                        </button>
                        <button className="px-8 py-4 rounded-xl font-bold bg-white border border-gray-200 text-[#464555] hover:bg-gray-50 hover:-translate-y-1 transition-all shadow-sm flex items-center gap-2" onClick={() => router.push("/arena/leaderboard")}>
                            <FiStar size={18} className="text-[#F5A623]" /> Leaderboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ========== ACTIVE CHALLENGE ==========
    return (
        <div className="min-h-[calc(100vh-72px)] bg-[#F8FAFC] p-6 md:p-10 text-[#111c2d]">
            <div className="fade-in max-w-[800px] mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider" style={{ background: `${catColor}15`, color: catColor }}>
                                {challenge?.category}
                            </span>
                            <span className="text-lg font-bold text-[#111c2d]">
                                {challenge?.title}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-[#464555]">
                                Question {currentQ + 1} of {totalQs}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#F5A623]/10 text-[#F5A623]">
                                {difficultyLabel(challenge?.difficulty || 2)}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className="h-full transition-all duration-500 ease-out" style={{ width: `${((currentQ + 1) / totalQs) * 100}%`, background: catColor }} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 shadow-sm">
                        <FiClock size={16} className="text-[#F5A623]" />
                        <span className="text-base font-black text-[#111c2d] font-mono">{formatTime(timer)}</span>
                    </div>
                </div>

                {/* Score tracker */}
                {scores.length > 0 && (
                    <div className="flex gap-2 mb-6">
                        {scores.map((s, i) => (
                            <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shadow-sm ${
                                s >= 7 ? 'bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20' : 
                                s >= 4 ? 'bg-[#F5A623]/10 text-[#F5A623] border border-[#F5A623]/20' : 
                                'bg-[#E53E3E]/10 text-[#E53E3E] border border-[#E53E3E]/20'
                            }`}>
                                {s}
                            </div>
                        ))}
                    </div>
                )}

                {/* Question */}
                <div className="glass-card rounded-[24px] p-8 mb-6 relative overflow-hidden" style={{ borderLeft: `4px solid ${catColor}` }}>
                    <div className="absolute top-0 right-0 w-32 h-32 opacity-5 rounded-bl-full" style={{ background: catColor }}></div>
                    <p className="text-lg font-bold text-[#111c2d] leading-relaxed relative z-10">
                        {challenge?.questions[currentQ]}
                    </p>
                </div>

                {/* Answer */}
                <textarea
                    className="w-full p-5 bg-white border border-gray-200 rounded-2xl focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/10 outline-none transition-all text-sm font-medium resize-y min-h-[160px] shadow-sm mb-2 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="Type your answer here..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    disabled={submitting}
                />
                
                <div className="flex justify-between items-center mb-6">
                    <span className="text-xs font-semibold text-gray-400">{answer.length} characters</span>
                </div>

                <button
                    className="w-full py-4 rounded-xl font-black text-white transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1"
                    onClick={submitAnswer}
                    disabled={submitting || answer.trim().length < 5}
                    style={{ background: `linear-gradient(135deg, ${catColor}, ${catColor}CC)`, boxShadow: `0 10px 25px -5px ${catColor}40` }}
                >
                    {submitting ? (
                        <div className="spinner border-t-white" style={{ width: "20px", height: "20px" }} />
                    ) : (
                        <>Submit Answer <FiCheck size={18} /></>
                    )}
                </button>

                {/* Feedback */}
                {showFeedback && feedback && (
                    <div className="glass-card slide-up rounded-[20px] p-5 mt-6 border border-gray-200">
                        <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-full flex flex-col items-center justify-center shrink-0 border-4 bg-white shadow-sm ${
                                feedback.score >= 7 ? 'border-[#34C759] text-[#34C759]' : 
                                feedback.score >= 4 ? 'border-[#F5A623] text-[#F5A623]' : 
                                'border-[#E53E3E] text-[#E53E3E]'
                            }`}>
                                <span className="text-xl font-black leading-none">{feedback.score}</span>
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">/10</span>
                            </div>
                            <p className="text-sm font-semibold text-[#464555] leading-relaxed flex-1">
                                {feedback.feedback}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
