"use client";

import React, { useEffect, useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import { FiBookOpen, FiUserCheck, FiGrid, FiX, FiCheckCircle } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MentorDashboard() {
    const { user, token } = useAuth();
    const router = useRouter();
    const [interviews, setInterviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInterview, setSelectedInterview] = useState<any>(null);
    const [feedbackText, setFeedbackText] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (token) fetchInterviews();
    }, [token]);

    const fetchInterviews = async () => {
        try {
            const res = await fetch("/api/mentor/interviews", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (!data.error && data.interviews) {
                setInterviews(data.interviews);
            }
        } catch (err) {
            console.error("Failed to fetch interviews", err);
        } finally {
            setLoading(false);
        }
    };

    const submitFeedback = async () => {
        if (!feedbackText.trim() || !selectedInterview) return;
        setSubmitting(true);
        try {
            const res = await fetch(`/api/mentor/interviews/${selectedInterview._id}/feedback`, {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ feedback: feedbackText })
            });
            const data = await res.json();
            if (!data.error) {
                // Update local state
                setInterviews(interviews.map(inv => 
                    inv._id === selectedInterview._id 
                        ? { ...inv, mentorFeedback: feedbackText, reviewedBy: { name: user?.name } } 
                        : inv
                ));
                setSelectedInterview(null);
                setFeedbackText("");
            } else {
                alert(data.error || "Failed to submit feedback");
            }
        } catch (err) {
            console.error(err);
            alert("Error submitting feedback");
        } finally {
            setSubmitting(false);
        }
    };

    const Sidebar = () => (
        <aside className="hidden md:flex flex-col h-full py-8 w-64 fixed left-0 top-[72px] glass-panel shadow-xl z-30">
            <div className="px-6 mb-8 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-xl font-bold bg-[#6C5CE7] text-white">
                    {user?.name?.charAt(0).toUpperCase() || "M"}
                </div>
                <div>
                    <p className="text-sm font-semibold truncate w-32">{user?.name || "Mentor"}</p>
                    <p className="text-xs text-[#6C5CE7] font-bold tracking-wider uppercase">Mentor</p>
                </div>
            </div>
            <nav className="flex-1 overflow-y-auto px-4 flex flex-col gap-1">
                <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-[#464555] hover:text-[#3525cd] hover:bg-[#3525cd]/5 transition-all duration-300 rounded-lg group">
                    <FiGrid size={18} />
                    <span className="text-sm">User Dashboard</span>
                </Link>
                <div className="flex items-center gap-3 px-4 py-3 text-[#6C5CE7] font-bold border-l-4 border-[#6C5CE7] bg-[#6C5CE7]/5 rounded-r-lg group mt-4">
                    <FiBookOpen size={18} />
                    <span className="text-sm">Mentor Portal</span>
                </div>
            </nav>
        </aside>
    );

    return (
        <RoleGuard allowedRoles={["Mentor", "Administrator"]}>
            <div className="flex h-screen overflow-hidden bg-[#F8FAFC] text-[#111c2d]">
                <Sidebar />
                <main className="flex-1 ml-0 md:ml-64 h-full overflow-y-auto w-full pt-[72px] px-4 md:px-8 py-8 relative">
                    <div className="fade-in max-w-[1000px] mx-auto mt-4">
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8 glass-card p-6 rounded-[24px]">
                            <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-[#6C5CE7] to-[#A29BFE] shadow-lg shadow-[#6C5CE7]/30 flex items-center justify-center shrink-0">
                                <FiBookOpen size={28} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-2 text-[#111c2d]">Mentor Dashboard</h1>
                                <p className="text-sm text-gray-500 font-medium">Review student performance and provide feedback.</p>
                            </div>
                        </div>

                        <div className="glass-card rounded-[24px] p-8 neomorphic-hover cursor-default">
                            <h2 className="text-xl font-bold text-[#111c2d] mb-6 flex items-center gap-2">
                                <FiUserCheck className="text-[#6C5CE7]" /> Students Completed Interviews
                            </h2>
                            
                            {loading ? (
                                <p className="text-gray-500">Loading interviews...</p>
                            ) : interviews.length === 0 ? (
                                <p className="text-gray-500">No completed interviews available for review yet.</p>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {interviews.map((interview, index) => (
                                        <div key={interview._id} className="p-5 bg-white border border-gray-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-[#6C5CE7]/10 flex items-center justify-center text-[#6C5CE7] font-bold shrink-0">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[#111c2d]">{interview.userId?.name || "Unknown Student"}</p>
                                                    <p className="text-xs text-gray-500 font-medium mt-1">{interview.topic} ({interview.totalQuestions} questions) • Score: {interview.averageScore}/10</p>
                                                    {interview.mentorFeedback && (
                                                        <span className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                                                            <FiCheckCircle /> Reviewed by {interview.reviewedBy?.name || "Mentor"}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => { setSelectedInterview(interview); setFeedbackText(interview.mentorFeedback || ""); }}
                                                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-white border border-gray-200 text-[#464555] hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap"
                                            >
                                                {interview.mentorFeedback ? "View / Edit Review" : "Review Interview"}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </main>
                
                {/* Review Modal */}
                {selectedInterview && (
                    <div className="fixed inset-0 bg-[#0b101c]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col fade-in">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                                <div>
                                    <h2 className="text-xl font-bold text-[#111c2d]">Review: {selectedInterview.userId?.name}</h2>
                                    <p className="text-sm text-gray-500">{selectedInterview.topic}</p>
                                </div>
                                <button onClick={() => setSelectedInterview(null)} className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#E53E3E] hover:border-[#E53E3E] transition-colors">
                                    <FiX size={20} />
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
                                <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4">
                                    <h3 className="font-bold text-gray-700 mb-2 border-b pb-2">Interview Transcript</h3>
                                    {selectedInterview.questions.map((q: any, i: number) => (
                                        <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm">
                                            <p className="font-bold text-[#111c2d] mb-2">Q{i+1}: {q.question}</p>
                                            <p className="text-gray-700 mb-2 bg-white p-3 rounded border border-gray-200"><strong>Answer:</strong> {q.answer || "(Skipped)"}</p>
                                            <p className="text-xs text-[#6C5CE7] font-semibold bg-[#6C5CE7]/10 p-2 rounded">AI Feedback: {q.feedback} (Score: {q.score}/10)</p>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="w-full md:w-[350px] flex flex-col gap-4 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 shrink-0">
                                    <h3 className="font-bold text-gray-700 mb-2 border-b pb-2">Mentor Feedback</h3>
                                    <textarea
                                        value={feedbackText}
                                        onChange={(e) => setFeedbackText(e.target.value)}
                                        placeholder="Write your constructive feedback for the student here..."
                                        className="w-full flex-1 min-h-[200px] p-4 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 text-sm"
                                    />
                                    <button 
                                        onClick={submitFeedback}
                                        disabled={submitting || !feedbackText.trim()}
                                        className="w-full py-3 rounded-xl bg-[#6C5CE7] text-white font-bold hover:bg-[#5a4bcf] transition-colors disabled:opacity-50"
                                    >
                                        {submitting ? "Submitting..." : "Submit Feedback"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </RoleGuard>
    );
}
