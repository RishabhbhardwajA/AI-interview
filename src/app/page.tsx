"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { FiArrowRight, FiPlay, FiTarget, FiFileText, FiAward, FiMic, FiTrendingUp, FiCheckCircle, FiZap, FiStar, FiBriefcase, FiBarChart2, FiCode, FiDatabase, FiServer, FiLayout, FiCpu, FiGlobe, FiGithub, FiLinkedin, FiTwitter, FiInstagram, FiHeart } from "react-icons/fi";

export default function HomePage() {
    const { isAuthenticated } = useAuth();

    // Parallax scroll effect
    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            const orbs = document.querySelectorAll<HTMLElement>(".parallax-orb");
            orbs.forEach((orb, i) => {
                const speed = 0.12 + i * 0.06;
                orb.style.transform = `translateY(${scrollY * speed}px)`;
            });
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Scroll-triggered animations
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("anim-visible");
                    }
                });
            },
            { threshold: 0.1 }
        );
        document.querySelectorAll(".anim-scroll").forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const features = [
        { icon: <FiTarget size={28} />, title: "Adaptive AI Engine", desc: "Questions dynamically adjust difficulty based on your real-time performance — just like a real interviewer.", color: "#3525cd" },
        { icon: <FiMic size={28} />, title: "Voice Interviews", desc: "Speak your answers naturally. Our conversational mode reads questions aloud and listens to your responses.", color: "#006a61" },
        { icon: <FiFileText size={28} />, title: "Resume Analysis", desc: "Get AI-powered feedback on your resume with a detailed score, keyword analysis, and actionable suggestions.", color: "#F5A623" },
        { icon: <FiBriefcase size={28} />, title: "Recruiter Simulator", desc: "Practice company-specific interviews. Simulate real hiring processes from Google, Amazon, Microsoft, and more.", color: "#E53E3E" },
        { icon: <FiAward size={28} />, title: "Challenge Arena", desc: "Compete in daily and weekly challenges across Technical, HR, Aptitude, and Domain-specific categories.", color: "#6C5CE7" },
        { icon: <FiBarChart2 size={28} />, title: "Progress Analytics", desc: "Track your growth with detailed reports, difficulty progression charts, and placement readiness scores.", color: "#0891b2" },
    ];

    const steps = [
        { step: "01", title: "Choose Your Topic", desc: "Select from React, Node.js, System Design, and more.", icon: <FiTarget size={24} /> },
        { step: "02", title: "Start the Interview", desc: "AI generates adaptive questions at your current level.", icon: <FiPlay size={24} /> },
        { step: "03", title: "Answer & Get Feedback", desc: "Type or speak your answer. Get instant AI evaluation.", icon: <FiMic size={24} /> },
        { step: "04", title: "Review & Improve", desc: "Study detailed reports and track your progress over time.", icon: <FiTrendingUp size={24} /> },
    ];

    const stats = [
        { value: "10+", label: "Topic Areas" },
        { value: "5", label: "Difficulty Levels" },
        { value: "Real-time", label: "AI Feedback" },
        { value: "∞", label: "Practice Sessions" },
    ];

    // Floating tech icons data
    const floatingIcons = [
        { label: "JS", bg: "#F7DF1E", text: "#000", top: "8%", left: "5%", delay: "0s", size: "56px" },
        { label: "TS", bg: "#3178C6", text: "#fff", top: "18%", right: "8%", delay: "1.2s", size: "48px" },
        { label: "⚛️", bg: "#222", text: "#61DAFB", top: "42%", left: "2%", delay: "0.6s", size: "52px" },
        { label: "CSS", bg: "#264de4", text: "#fff", top: "62%", right: "4%", delay: "1.8s", size: "44px" },
        { label: "{ }", bg: "#3525cd", text: "#fff", top: "78%", left: "8%", delay: "0.3s", size: "40px" },
        { label: "🐍", bg: "#306998", text: "#FFD43B", top: "5%", right: "35%", delay: "2.1s", size: "42px" },
        { label: "DB", bg: "#006a61", text: "#fff", top: "85%", right: "15%", delay: "1.5s", size: "44px" },
        { label: "☕", bg: "#f89820", text: "#fff", top: "30%", right: "2%", delay: "0.9s", size: "46px" },
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-[#111c2d] relative overflow-hidden">
            {/* Animated background */}
            <div className="parallax-orb absolute -top-40 -left-40 w-[600px] h-[600px] bg-[#3525cd] opacity-[0.04] rounded-full blur-[120px] pointer-events-none"></div>
            <div className="parallax-orb absolute top-[40%] -right-60 w-[700px] h-[700px] bg-[#006a61] opacity-[0.04] rounded-full blur-[140px] pointer-events-none"></div>
            <div className="parallax-orb absolute bottom-[10%] left-[20%] w-[500px] h-[500px] bg-[#6C5CE7] opacity-[0.03] rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute inset-0 pointer-events-none opacity-[0.015]" style={{ backgroundImage: "radial-gradient(circle, #3525cd 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>

            {/* ============ HERO — SPLIT LAYOUT ============ */}
            <section className="relative z-10 max-w-[1300px] mx-auto px-6 pt-28 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Left — Text */}
                    <div className="fade-in">
                        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white shadow-md border border-gray-100 text-[#3525cd] text-xs font-bold mb-8 tracking-wider uppercase hero-badge">
                            <FiZap size={14} className="text-[#F5A623]" />
                            Powered by Groq AI • Blazing Fast
                        </div>

                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[0.95] mb-6 tracking-tight">
                            Practice
                            <br />
                            Interviews
                            <br />
                            <span className="hero-gradient-text">
                                That Feel Real
                            </span>
                        </h1>

                        <p className="text-lg text-[#464555] max-w-lg mb-10 leading-relaxed font-medium">
                            An AI interviewer that adapts to your skill level in real-time.
                            Get instant feedback, practice with voice, and build unshakable confidence.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            {isAuthenticated ? (
                                <>
                                    <Link href="/interview" className="group px-8 py-4 rounded-2xl font-bold text-white bg-[#3525cd] hover:bg-[#281a9c] transition-all duration-300 shadow-xl shadow-[#3525cd]/30 hover:-translate-y-1 flex items-center gap-3 justify-center text-lg">
                                        Start Interview <FiArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                    <Link href="/dashboard" className="px-8 py-4 rounded-2xl font-bold bg-white/80 backdrop-blur-sm border border-gray-200 text-[#464555] hover:bg-white hover:-translate-y-1 transition-all shadow-lg flex items-center gap-3 justify-center text-lg">
                                        View Dashboard
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link href="/signup" className="group px-8 py-4 rounded-2xl font-bold text-white bg-[#3525cd] hover:bg-[#281a9c] transition-all duration-300 shadow-xl shadow-[#3525cd]/30 hover:-translate-y-1 flex items-center gap-3 justify-center text-lg">
                                        Get Started Free <FiArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                    <Link href="/login" className="px-8 py-4 rounded-2xl font-bold bg-white/80 backdrop-blur-sm border border-gray-200 text-[#464555] hover:bg-white hover:-translate-y-1 transition-all shadow-lg flex items-center gap-3 justify-center text-lg">
                                        Sign In
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Trust badges */}
                        <div className="flex items-center gap-4 mt-10 text-sm text-gray-400 font-medium">
                            <div className="flex items-center gap-1.5"><FiCheckCircle size={16} className="text-[#006a61]" /> Free to start</div>
                            <div className="flex items-center gap-1.5"><FiCheckCircle size={16} className="text-[#006a61]" /> No credit card</div>
                            <div className="flex items-center gap-1.5"><FiCheckCircle size={16} className="text-[#006a61]" /> Voice enabled</div>
                        </div>
                    </div>

                    {/* Right — Interview Visual with Floating Icons */}
                    <div className="relative w-full min-h-[520px] hidden lg:block fade-in" style={{ animationDelay: "0.3s" }}>
                        {/* Floating tech icons */}
                        {floatingIcons.map((icon, i) => (
                            <div
                                key={i}
                                className="absolute rounded-2xl shadow-lg flex items-center justify-center font-black text-xs select-none floating-icon z-20"
                                style={{
                                    top: icon.top, left: icon.left, right: icon.right,
                                    width: icon.size, height: icon.size,
                                    background: icon.bg, color: icon.text,
                                    animationDelay: icon.delay,
                                    fontSize: icon.label.length > 2 ? "18px" : "14px",
                                } as React.CSSProperties}
                            >
                                {icon.label}
                            </div>
                        ))}

                        {/* Interview scene card */}
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <div className="w-full max-w-[480px] glass-card rounded-[28px] p-1.5 shadow-2xl border border-white/30 hero-card-float">
                                <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-[22px] p-7 text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-[#3525cd] opacity-20 rounded-full blur-[60px]"></div>
                                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#006a61] opacity-15 rounded-full blur-[50px]"></div>

                                    {/* Terminal dots */}
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="flex gap-1.5">
                                            <span className="w-3 h-3 rounded-full bg-[#FF5F57]"></span>
                                            <span className="w-3 h-3 rounded-full bg-[#FFBD2E]"></span>
                                            <span className="w-3 h-3 rounded-full bg-[#28CA41]"></span>
                                        </div>
                                        <span className="text-[10px] text-gray-500 font-mono">InterviewAI — Live Session</span>
                                    </div>

                                    {/* AI interviewer */}
                                    <div className="flex items-start gap-3 mb-5">
                                        <div className="w-9 h-9 rounded-full bg-[#3525cd] flex items-center justify-center shrink-0 text-[10px] font-black shadow-lg shadow-[#3525cd]/30">AI</div>
                                        <div className="flex-1">
                                            <p className="text-[10px] text-gray-400 font-bold mb-1 uppercase tracking-wider">Interviewer • React Hooks • Intermediate</p>
                                            <p className="text-sm text-white/90 font-medium leading-relaxed typing-anim">Explain how React&apos;s useEffect hook works, including its cleanup mechanism. When would you use the dependency array?</p>
                                        </div>
                                    </div>

                                    {/* Candidate */}
                                    <div className="flex items-start gap-3 mb-5 pl-2">
                                        <div className="w-9 h-9 rounded-full bg-[#006a61] flex items-center justify-center shrink-0 text-[10px] font-black">You</div>
                                        <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3">
                                            <p className="text-xs text-white/70 font-medium leading-relaxed">useEffect runs side effects after render. The cleanup function returned handles unmount or dependency changes. The dependency array controls when...</p>
                                        </div>
                                    </div>

                                    {/* Status bar */}
                                    <div className="flex items-center justify-between border-t border-white/10 pt-4">
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#006a61]/20 border border-[#006a61]/30">
                                            <FiMic size={12} className="text-green-400 animate-pulse" />
                                            <span className="text-[10px] text-green-300 font-bold">Voice Mode Active</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] text-gray-500 font-mono">Q3 of 10</span>
                                            <span className="text-[10px] text-gray-500 font-mono">02:34</span>
                                        </div>
                                    </div>

                                    {/* Score preview */}
                                    <div className="mt-4 bg-white/5 rounded-xl p-3 border border-white/10">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold text-[#a5b4fc] uppercase tracking-wider">AI Evaluation</span>
                                            <span className="text-lg font-black text-[#28CA41]">8<span className="text-xs text-gray-500">/10</span></span>
                                        </div>
                                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-[#3525cd] to-[#28CA41] rounded-full" style={{ width: "80%" }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============ STATS BAR ============ */}
            <section className="relative z-10 max-w-[1000px] mx-auto px-6 mb-28">
                <div className="anim-scroll opacity-0 translate-y-8 glass-card rounded-[24px] p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((s, i) => (
                        <div key={i} className="text-center">
                            <p className="text-3xl md:text-4xl font-black text-[#3525cd] mb-1">{s.value}</p>
                            <p className="text-sm text-[#464555] font-semibold">{s.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ============ FEATURES SECTION ============ */}
            <section className="relative z-10 max-w-[1200px] mx-auto px-6 mb-32">
                <div className="anim-scroll opacity-0 translate-y-8 text-center mb-16">
                    <p className="text-sm font-bold text-[#3525cd] uppercase tracking-widest mb-3">Everything You Need</p>
                    <h2 className="text-4xl md:text-5xl font-black mb-4">One Platform, Complete Prep</h2>
                    <p className="text-lg text-[#464555] font-medium max-w-2xl mx-auto">From adaptive AI interviews to resume analysis and peer challenges — everything to get you placement-ready.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((f, i) => (
                        <div
                            key={i}
                            className="anim-scroll opacity-0 translate-y-8 glass-card rounded-[24px] p-8 neomorphic-hover cursor-default group"
                            style={{ transitionDelay: `${i * 100}ms` }}
                        >
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" style={{ background: `${f.color}15`, color: f.color }}>
                                {f.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-[#111c2d]">{f.title}</h3>
                            <p className="text-sm text-[#464555] leading-relaxed font-medium">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ============ HOW IT WORKS ============ */}
            <section className="relative z-10 max-w-[1100px] mx-auto px-6 mb-32">
                <div className="anim-scroll opacity-0 translate-y-8 text-center mb-16">
                    <p className="text-sm font-bold text-[#006a61] uppercase tracking-widest mb-3">Simple Process</p>
                    <h2 className="text-4xl md:text-5xl font-black mb-4">How It Works</h2>
                    <p className="text-lg text-[#464555] font-medium max-w-xl mx-auto">Four simple steps to sharpen your interview skills and land your dream job.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {steps.map((s, i) => (
                        <div
                            key={i}
                            className="anim-scroll opacity-0 translate-y-8 relative group"
                            style={{ transitionDelay: `${i * 150}ms` }}
                        >
                            <div className="glass-card rounded-[24px] p-8 neomorphic-hover cursor-default h-full">
                                <span className="text-6xl font-black text-[#3525cd]/10 absolute top-4 right-6 select-none group-hover:text-[#3525cd]/20 transition-colors">{s.step}</span>
                                <div className="w-12 h-12 rounded-xl bg-[#3525cd]/10 text-[#3525cd] flex items-center justify-center mb-5">
                                    {s.icon}
                                </div>
                                <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                                <p className="text-sm text-[#464555] font-medium leading-relaxed">{s.desc}</p>
                            </div>
                            {i < 3 && <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gray-200"></div>}
                        </div>
                    ))}
                </div>
            </section>

            {/* ============ TESTIMONIAL ============ */}
            <section className="relative z-10 max-w-[1100px] mx-auto px-6 mb-32">
                <div className="anim-scroll opacity-0 translate-y-8 glass-card rounded-[32px] p-12 md:p-16 text-center bg-gradient-to-br from-[#3525cd]/5 to-[#006a61]/5 border border-white/40">
                    <div className="flex justify-center gap-1 mb-6">
                        {[1, 2, 3, 4, 5].map(i => <FiStar key={i} size={24} className="text-[#F5A623] fill-[#F5A623]" />)}
                    </div>
                    <blockquote className="text-xl md:text-2xl font-bold text-[#111c2d] mb-6 max-w-3xl mx-auto leading-relaxed">
                        &ldquo;The adaptive difficulty is incredible. It felt like I was talking to a real senior engineer. After 2 weeks of practice, I cleared my Amazon interview with confidence.&rdquo;
                    </blockquote>
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#3525cd]/10 flex items-center justify-center text-[#3525cd] font-bold">R</div>
                        <div className="text-left">
                            <p className="text-sm font-bold">Rahul S.</p>
                            <p className="text-xs text-gray-500">SDE @ Amazon, Class of 2025</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============ CTA ============ */}
            <section className="relative z-10 max-w-[900px] mx-auto px-6 mb-24">
                <div className="anim-scroll opacity-0 translate-y-8 rounded-[32px] p-12 md:p-16 text-center bg-gradient-to-br from-[#3525cd] to-[#1a1066] text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-60 h-60 bg-white opacity-5 rounded-full blur-[80px]"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#006a61] opacity-10 rounded-full blur-[60px]"></div>
                    <h2 className="text-3xl md:text-5xl font-black mb-4 relative z-10">Ready to Ace Your Next Interview?</h2>
                    <p className="text-lg text-white/70 mb-10 max-w-xl mx-auto relative z-10 font-medium">Join thousands of students who are building confidence and landing their dream jobs with AI-powered practice.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                        {isAuthenticated ? (
                            <Link href="/interview" className="group px-10 py-5 rounded-2xl font-bold bg-white text-[#3525cd] hover:bg-gray-100 transition-all shadow-xl hover:-translate-y-1 flex items-center gap-3 justify-center text-lg">
                                Start Practicing Now <FiArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        ) : (
                            <Link href="/signup" className="group px-10 py-5 rounded-2xl font-bold bg-white text-[#3525cd] hover:bg-gray-100 transition-all shadow-xl hover:-translate-y-1 flex items-center gap-3 justify-center text-lg">
                                Create Free Account <FiArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            {/* ============ FOOTER ============ */}
            <footer className="relative z-10 border-t border-gray-100 py-12">
                <div className="max-w-[1200px] mx-auto px-6">
                    {/* Top row */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
                        <div className="flex items-center gap-3">
                            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain rounded-lg" />
                            <span className="text-lg font-black text-[#111c2d]">InterviewAI</span>
                        </div>

                        {/* Social Media Links */}
                        <div className="flex items-center gap-3">
                            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[#464555] hover:text-[#3525cd] hover:border-[#3525cd]/30 hover:-translate-y-1 transition-all shadow-sm">
                                <FiGithub size={18} />
                            </a>
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[#464555] hover:text-[#0077B5] hover:border-[#0077B5]/30 hover:-translate-y-1 transition-all shadow-sm">
                                <FiLinkedin size={18} />
                            </a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[#464555] hover:text-[#1DA1F2] hover:border-[#1DA1F2]/30 hover:-translate-y-1 transition-all shadow-sm">
                                <FiTwitter size={18} />
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[#464555] hover:text-[#E1306C] hover:border-[#E1306C]/30 hover:-translate-y-1 transition-all shadow-sm">
                                <FiInstagram size={18} />
                            </a>
                        </div>

                        <div className="flex gap-6 text-sm font-semibold text-[#464555]">
                            <Link href="/login" className="hover:text-[#3525cd] transition-colors">Login</Link>
                            <Link href="/signup" className="hover:text-[#3525cd] transition-colors">Sign Up</Link>
                            <Link href="/dashboard" className="hover:text-[#3525cd] transition-colors">Dashboard</Link>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gray-100 mb-6"></div>

                    {/* Bottom row */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-gray-400 font-medium">
                            © {new Date().getFullYear()} InterviewAI. All rights reserved.
                        </p>
                        <p className="text-sm text-gray-400 font-medium flex items-center gap-1.5">
                            Made with <FiHeart size={14} className="text-[#E53E3E] fill-[#E53E3E]" /> by <span className="font-bold text-[#111c2d]">Rishabh</span>
                        </p>
                    </div>
                </div>
            </footer>

            {/* ============ GLOBAL ANIMATIONS ============ */}
            <style jsx global>{`
                .anim-scroll {
                    transition: opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1), transform 0.9s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .anim-visible {
                    opacity: 1 !important;
                    transform: translateY(0) !important;
                }

                /* Floating tech icons */
                @keyframes float-icon {
                    0%   { transform: translateY(0px) rotate(0deg); }
                    25%  { transform: translateY(-14px) rotate(4deg); }
                    50%  { transform: translateY(-6px) rotate(-2deg); }
                    75%  { transform: translateY(-18px) rotate(3deg); }
                    100% { transform: translateY(0px) rotate(0deg); }
                }
                .floating-icon {
                    animation: float-icon 6s ease-in-out infinite;
                    backdrop-filter: blur(4px);
                    border: 1px solid rgba(255,255,255,0.2);
                }

                /* Hero card float */
                @keyframes card-float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-12px); }
                }
                .hero-card-float {
                    animation: card-float 5s ease-in-out infinite;
                }

                /* Hero badge bounce */
                @keyframes badge-bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .hero-badge {
                    animation: badge-bounce 3s ease-in-out infinite;
                }

                /* Gradient text animation */
                .hero-gradient-text {
                    background: linear-gradient(90deg, #3525cd, #6C5CE7, #006a61, #3525cd);
                    background-size: 300% auto;
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: gradient-move 5s ease-in-out infinite;
                }
                @keyframes gradient-move {
                    0%   { background-position: 0% center; }
                    50%  { background-position: 100% center; }
                    100% { background-position: 0% center; }
                }

                /* Typing cursor */
                .typing-anim {
                    border-right: 2px solid rgba(165, 180, 252, 0.5);
                    animation: blink-cursor 1s step-end infinite;
                }
                @keyframes blink-cursor {
                    50% { border-color: transparent; }
                }
            `}</style>
        </div>
    );
}
