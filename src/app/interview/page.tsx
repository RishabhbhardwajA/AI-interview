"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiSkipForward, FiClock, FiArrowUp, FiArrowDown, FiMinus, FiCheck, FiMic, FiMicOff, FiVolume2 } from "react-icons/fi";
import Link from "next/link";
import { FiGrid, FiTarget, FiPlay, FiFileText, FiBriefcase, FiAward, FiSettings } from "react-icons/fi";

const TOPICS = [
    "React Hooks",
    "State Management",
    "JavaScript Fundamentals",
    "TypeScript",
    "Node.js & Express",
    "CSS & Layout",
    "REST APIs",
    "System Design",
    "Performance Optimization",
    "Database & MongoDB",
];

export default function InterviewPage() {
    const { user, token, isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();

    const [phase, setPhase] = useState<"setup" | "active" | "completed">("setup");
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
    } | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [timer, setTimer] = useState(0);
    const [reportData, setReportData] = useState<Record<string, unknown> | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const recognitionRef = useRef<any>(null);
    const [autoVoiceMode, setAutoVoiceMode] = useState(false);
    const autoVoiceModeRef = useRef(false);

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                
                recognition.onresult = (event: any) => {
                    let finalTranscript = "";
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript + " ";
                        }
                    }
                    if (finalTranscript) {
                        setAnswer(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + finalTranscript);
                    }
                };
                
                recognition.onerror = (event: any) => {
                    console.error("Speech recognition error", event.error);
                    setIsListening(false);
                };
                
                recognition.onend = () => {
                    setIsListening(false);
                };
                
                recognitionRef.current = recognition;
            }
        }
        
        return () => {
            if (window.speechSynthesis) window.speechSynthesis.cancel();
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
            return;
        }
        
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (err) {
                console.error("Failed to start listening", err);
            }
        }
    };

    // Keep ref in sync with state for use inside callbacks
    useEffect(() => {
        autoVoiceModeRef.current = autoVoiceMode;
    }, [autoVoiceMode]);

    const startListeningAuto = useCallback(() => {
        if (!recognitionRef.current) return;
        try {
            recognitionRef.current.start();
            setIsListening(true);
        } catch (err) {
            console.error("Auto-listen failed", err);
        }
    }, []);

    const speakQuestion = useCallback((text: string, autoListen: boolean) => {
        if (!text) return;
        if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
            setIsSpeaking(false);
            // If conversational mode is on, auto-start listening after AI finishes speaking
            if (autoListen && autoVoiceModeRef.current) {
                setTimeout(() => startListeningAuto(), 300);
            }
        };
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    }, [startListeningAuto]);

    const readQuestion = useCallback(() => {
        if (!currentQuestion) return;
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        } else {
            speakQuestion(currentQuestion, true);
        }
    }, [currentQuestion, speakQuestion]);

    // Auto-speak question when it changes in conversational mode
    const prevQuestionRef = useRef("");
    useEffect(() => {
        if (autoVoiceMode && phase === "active" && currentQuestion && currentQuestion !== prevQuestionRef.current) {
            prevQuestionRef.current = currentQuestion;
            // Small delay to let state settle after question transition
            const t = setTimeout(() => speakQuestion(currentQuestion, true), 500);
            return () => clearTimeout(t);
        }
    }, [currentQuestion, autoVoiceMode, phase, speakQuestion]);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) router.push("/login");
    }, [authLoading, isAuthenticated, router]);

    // Timer
    useEffect(() => {
        if (phase === "active") {
            timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
            return () => { if (timerRef.current) clearInterval(timerRef.current); };
        }
    }, [phase, questionNumber]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

    const difficultyLabel = (d: number) => ["", "Easy", "Basic", "Intermediate", "Advanced", "Expert"][d] || "";
    const difficultyColor = (d: number) => ["", "#34C759", "#7BC95A", "#F5A623", "#F07C3E", "#E53E3E"][d] || "#3525cd";

    const startInterview = useCallback(async () => {
        if (!selectedTopic || !token) return;
        setStarting(true);
        setStartError("");
        try {
            const res = await fetch("/api/interview", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ action: "start", topic: selectedTopic, totalQuestions: questionCount }),
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
    }, [selectedTopic, token, questionCount]);

    const submitAnswer = useCallback(async (skipped = false) => {
        if (submitting) return;
        if (!skipped && answer.trim().length < 5) return;
        setSubmitting(true);
        setShowFeedback(false);

        if (window.speechSynthesis) window.speechSynthesis.cancel();
        if (isListening && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }

        try {
            const res = await fetch("/api/interview", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ action: "answer", interviewId, answer: skipped ? "" : answer, timeTaken: timer, skipped }),
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
                }, 3000);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to submit answer. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }, [submitting, answer, token, interviewId, timer]);

    if (authLoading) {
        return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center"><div className="spinner-lg spinner" /></div>;
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
                <Link href="/interview" className="relative flex items-center gap-3 px-4 py-3 text-[#3525cd] font-bold border-l-4 border-[#3525cd] bg-[#3525cd]/5 rounded-r-lg group">
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

    // SETUP PHASE
    if (phase === "setup") {
        return (
            <div className="flex h-screen overflow-hidden bg-[#F8FAFC] text-[#111c2d]">
                <Sidebar />
                <main className="flex-1 ml-0 md:ml-64 h-full overflow-y-auto w-full pt-[72px] px-4 md:px-8 py-8">
                    <div className="fade-in max-w-[700px] mx-auto mt-10">
                        <header className="flex flex-col gap-2 mb-8">
                            <h1 className="text-4xl font-bold">Start an Interview</h1>
                            <p className="text-lg text-[#464555]">Choose a topic and the AI will adapt questions to your level.</p>
                        </header>

                        {startError && (
                            <div className="glass-card mb-6 p-4 border border-[#E53E3E] bg-[#E53E3E]/5 text-[#E53E3E] rounded-xl flex flex-col gap-1">
                                <strong className="font-bold">Session Creation Failed</strong>
                                <span className="text-sm">{startError}</span>
                            </div>
                        )}

                        <div className="glass-card rounded-[24px] p-8">
                            <label className="block text-sm font-bold mb-4 uppercase tracking-wider text-[#464555]">Select Topic</label>
                            <div className="flex flex-wrap gap-3 mb-8">
                                {TOPICS.map((topic) => (
                                    <button
                                        key={topic}
                                        onClick={() => setSelectedTopic(topic)}
                                        className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                                            selectedTopic === topic
                                                ? 'bg-[#3525cd] text-white shadow-md shadow-[#3525cd]/30 transform scale-105'
                                                : 'bg-white border border-gray-200 text-[#464555] hover:border-[#3525cd]/50 hover:bg-[#3525cd]/5'
                                        }`}
                                    >
                                        {topic}
                                    </button>
                                ))}
                            </div>

                            <label className="block text-sm font-bold mb-4 uppercase tracking-wider text-[#464555]">Number of Questions</label>
                            <div className="flex gap-4 mb-10">
                                {[5, 10, 15].map((n) => (
                                    <button
                                        key={n}
                                        onClick={() => setQuestionCount(n)}
                                        className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                                            questionCount === n
                                                ? 'bg-[#006a61] text-white shadow-md shadow-[#006a61]/30 transform scale-105'
                                                : 'bg-white border border-gray-200 text-[#464555] hover:border-[#006a61]/50 hover:bg-[#006a61]/5'
                                        }`}
                                    >
                                        {n} Qs
                                    </button>
                                ))}
                            </div>

                            <button
                                className={`w-full py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-3 transition-all duration-300 ${
                                    !selectedTopic || starting 
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-[#3525cd] text-white hover:bg-[#281a9c] shadow-lg shadow-[#3525cd]/20'
                                }`}
                                disabled={!selectedTopic || starting}
                                onClick={startInterview}
                            >
                                {starting ? <div className="spinner border-t-white" style={{ width: "24px", height: "24px" }} /> : <>Start Adaptive Interview <FiArrowRight size={22} /></>}
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // COMPLETED PHASE
    if (phase === "completed" && reportData) {
        router.push(`/report/${(reportData as { id: string }).id}`);
        return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center"><div className="spinner-lg spinner" /></div>;
    }

    // ACTIVE PHASE
    return (
        <div className="flex h-screen overflow-hidden bg-[#F8FAFC] text-[#111c2d]">
            <Sidebar />
            <main className="flex-1 ml-0 md:ml-64 h-full overflow-y-auto w-full pt-[72px] px-4 md:px-8 py-8">
                <div className="fade-in max-w-[1000px] mx-auto mt-4">
                    {/* Top Bar */}
                    <div className="flex items-center justify-between mb-8 glass-card p-4 rounded-2xl">
                        <div className="flex-1 px-4">
                            <div className="flex items-center gap-4 mb-2">
                                <span className="text-sm font-bold text-[#464555] uppercase tracking-wider">Question {questionNumber} of {totalQuestions}</span>
                                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider" style={{ background: `${difficultyColor(currentDifficulty)}15`, color: difficultyColor(currentDifficulty) }}>
                                    {difficultyLabel(currentDifficulty)}
                                </span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-[#3525cd] transition-all duration-500 ease-out" style={{ width: `${(questionNumber / totalQuestions) * 100}%` }} />
                            </div>
                        </div>
                        <div className="flex items-center gap-4 ml-6">
                            {/* Conversational Mode Toggle */}
                            <button
                                onClick={() => setAutoVoiceMode(prev => !prev)}
                                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-sm border ${
                                    autoVoiceMode
                                        ? 'bg-[#3525cd] text-white border-[#3525cd] shadow-[#3525cd]/20'
                                        : 'bg-white text-[#464555] border-gray-200 hover:border-[#3525cd]/30'
                                }`}
                                title="Toggle Conversational Mode: AI speaks questions, you answer by voice"
                            >
                                <FiMic size={16} />
                                <span className="hidden sm:inline">Voice Mode</span>
                                <span className={`w-2 h-2 rounded-full ${autoVoiceMode ? 'bg-green-300 animate-pulse' : 'bg-gray-300'}`} />
                            </button>
                            <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-gray-100 shadow-sm">
                                <FiClock size={20} className="text-[#006a61]" />
                                <span className="text-lg font-bold font-mono tracking-widest">{formatTime(timer)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Question & Answer */}
                        <div className="lg:col-span-2 flex flex-col gap-4">
                            <div className="glass-card rounded-2xl p-8 shadow-sm">
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-[#3525cd]/10 text-[#3525cd] flex items-center justify-center shrink-0 mt-1">
                                        <span className="font-bold text-sm">Q</span>
                                    </div>
                                    <p className="text-xl font-semibold leading-relaxed flex-1">{currentQuestion}</p>
                                    <button 
                                        onClick={readQuestion}
                                        className={`p-2 rounded-full transition-colors ${isSpeaking ? 'bg-[#3525cd]/20 text-[#3525cd]' : 'hover:bg-gray-100 text-gray-500'}`}
                                        title="Read question out loud"
                                    >
                                        <FiVolume2 size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="glass-card rounded-2xl p-2 relative">
                                <textarea
                                    className="w-full bg-transparent border-none focus:ring-0 resize-none p-6 text-lg placeholder-gray-400"
                                    placeholder="Type your answer here or click Dictate..."
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    disabled={submitting}
                                    style={{ minHeight: "240px", outline: 'none' }}
                                />
                                <div className="absolute bottom-4 left-6">
                                    <button 
                                        onClick={toggleListening}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm ${
                                            isListening 
                                            ? 'bg-red-100 text-red-600 animate-pulse border border-red-200' 
                                            : 'bg-gray-100 text-[#464555] hover:bg-gray-200 border border-gray-200'
                                        }`}
                                    >
                                        {isListening ? <><FiMicOff size={16} /> Stop Recording...</> : <><FiMic size={16} /> Dictate Answer</>}
                                    </button>
                                </div>
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
                                    className="flex-1 py-4 rounded-xl font-bold bg-[#3525cd] text-white hover:bg-[#281a9c] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#3525cd]/20 disabled:opacity-50 disabled:bg-gray-300 disabled:shadow-none"
                                    onClick={() => submitAnswer(false)}
                                    disabled={submitting || answer.trim().length < 5}
                                >
                                    {submitting ? <div className="spinner border-t-white" style={{ width: "20px", height: "20px" }} /> : <>Submit Answer <FiCheck size={20} /></>}
                                </button>
                            </div>
                        </div>

                        {/* Feedback Panel */}
                        <div className="lg:col-span-1">
                            {showFeedback && feedback ? (
                                <div className="gradient-banner-2 rounded-2xl p-6 slide-up h-full border border-white/60 shadow-lg">
                                    <p className="text-xs font-bold text-[#3525cd] uppercase tracking-wider mb-6">AI Evaluation</p>

                                    <div className="flex items-center gap-6 mb-8">
                                        <div className={`w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center bg-white shadow-sm
                                            ${feedback.score >= 7 ? "border-[#006a61] text-[#006a61]" : feedback.score >= 4 ? "border-[#F5A623] text-[#F5A623]" : "border-[#E53E3E] text-[#E53E3E]"}`}>
                                            <span className="text-3xl font-black">{feedback.score}</span>
                                            <span className="text-xs font-bold opacity-50">/10</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-semibold text-[#464555]">Difficulty Level</span>
                                            <div className="flex items-center gap-1">
                                                {feedback.difficultyAdjustment === "increase" && <><FiArrowUp size={18} className="text-[#006a61]" /><span className="text-[#006a61] font-bold">Increased</span></>}
                                                {feedback.difficultyAdjustment === "decrease" && <><FiArrowDown size={18} className="text-[#E53E3E]" /><span className="text-[#E53E3E] font-bold">Decreased</span></>}
                                                {feedback.difficultyAdjustment === "maintain" && <><FiMinus size={18} className="text-[#F5A623]" /><span className="text-[#F5A623] font-bold">Maintained</span></>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/60 backdrop-blur-md rounded-xl p-4 mb-6">
                                        <p className="text-sm text-[#111c2d] leading-relaxed font-medium">{feedback.feedback}</p>
                                    </div>

                                    {feedback.keyPointsCovered.length > 0 && (
                                        <div className="mb-4">
                                            <p className="text-xs font-bold text-[#006a61] uppercase tracking-wider mb-2 flex items-center gap-2"><FiCheck /> Covered</p>
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
                                            <p className="text-xs font-bold text-[#F5A623] uppercase tracking-wider mb-2 flex items-center gap-2"><FiTarget /> Improve</p>
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
                                    <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 text-2xl">💡</div>
                                    <h3 className="font-bold text-lg mb-2">Awaiting Answer</h3>
                                    <p className="text-sm text-[#464555]">Submit your answer to receive real-time AI feedback and watch the difficulty adapt.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
