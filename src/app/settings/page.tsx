"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    FiSettings, FiUser, FiLock, FiShield, FiTrash2, FiCheck,
    FiGrid, FiTarget, FiPlay, FiFileText, FiBriefcase, FiAward,
    FiAlertTriangle, FiEye, FiEyeOff, FiEdit3, FiSave
} from "react-icons/fi";

export default function SettingsPage() {
    const { user, token, isAuthenticated, loading: authLoading, logout } = useAuth();
    const router = useRouter();

    // Profile state
    const [profileName, setProfileName] = useState("");
    const [profileExperience, setProfileExperience] = useState("Fresher");
    const [profileEmail, setProfileEmail] = useState("");
    const [profileCreatedAt, setProfileCreatedAt] = useState("");
    const [profilePasswordUpdatedAt, setProfilePasswordUpdatedAt] = useState("");
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [editingProfile, setEditingProfile] = useState(false);

    // Password state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [passwordChanging, setPasswordChanging] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Delete state
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteMessage, setDeleteMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Active tab
    const [activeTab, setActiveTab] = useState<"profile" | "password" | "security" | "danger">("profile");

    useEffect(() => {
        if (!authLoading && !isAuthenticated) router.push("/login");
    }, [authLoading, isAuthenticated, router]);

    // Fetch profile
    const fetchProfile = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch("/api/settings", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok && data.user) {
                setProfileName(data.user.name || "");
                setProfileExperience(data.user.experienceLevel || "Fresher");
                setProfileEmail(data.user.email || "");
                setProfileCreatedAt(data.user.createdAt || "");
                setProfilePasswordUpdatedAt(data.user.passwordUpdatedAt || "");
            }
        } catch (err) {
            console.error("Failed to fetch profile", err);
        } finally {
            setProfileLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) fetchProfile();
    }, [token, fetchProfile]);

    // Save Profile
    const handleSaveProfile = async () => {
        setProfileSaving(true);
        setProfileMessage(null);
        try {
            const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ action: "update-profile", name: profileName, experienceLevel: profileExperience }),
            });
            const data = await res.json();
            if (res.ok) {
                setProfileMessage({ type: "success", text: "Profile updated successfully!" });
                setEditingProfile(false);
            } else {
                setProfileMessage({ type: "error", text: data.error || "Failed to update profile" });
            }
        } catch {
            setProfileMessage({ type: "error", text: "Network error" });
        } finally {
            setProfileSaving(false);
        }
    };

    // Change Password
    const handleChangePassword = async () => {
        setPasswordMessage(null);
        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: "error", text: "New passwords do not match" });
            return;
        }
        setPasswordChanging(true);
        try {
            const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ action: "change-password", currentPassword, newPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                setPasswordMessage({ type: "success", text: "Password changed successfully!" });
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                fetchProfile();
            } else {
                setPasswordMessage({ type: "error", text: data.error || "Failed to change password" });
            }
        } catch {
            setPasswordMessage({ type: "error", text: "Network error" });
        } finally {
            setPasswordChanging(false);
        }
    };

    // Delete Account
    const handleDeleteAccount = async () => {
        setDeleteMessage(null);
        setDeleting(true);
        try {
            const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ action: "delete-account", password: deletePassword }),
            });
            const data = await res.json();
            if (res.ok) {
                logout();
                router.push("/");
            } else {
                setDeleteMessage({ type: "error", text: data.error || "Failed to delete account" });
            }
        } catch {
            setDeleteMessage({ type: "error", text: "Network error" });
        } finally {
            setDeleting(false);
        }
    };

    if (authLoading || profileLoading) {
        return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center"><div className="spinner-lg spinner border-t-[#3525cd]" /></div>;
    }

    // Password strength indicator
    const getPasswordStrength = (p: string) => {
        let score = 0;
        if (p.length >= 8) score++;
        if (/[A-Z]/.test(p)) score++;
        if (/[a-z]/.test(p)) score++;
        if (/[0-9]/.test(p)) score++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(p)) score++;
        return score;
    };
    const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    const strengthColors = ["#E53E3E", "#F07C3E", "#F5A623", "#7BC95A", "#006a61"];
    const pwStrength = getPasswordStrength(newPassword);

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
                <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-[#464555] hover:text-[#3525cd] hover:bg-[#3525cd]/5 transition-all duration-300 rounded-lg">
                    <FiGrid size={18} /><span className="text-sm">Dashboard</span>
                </Link>
                <Link href="/readiness" className="flex items-center gap-3 px-4 py-3 text-[#464555] hover:text-[#3525cd] hover:bg-[#3525cd]/5 transition-all duration-300 rounded-lg">
                    <FiTarget size={18} /><span className="text-sm">Readiness</span>
                </Link>
                <Link href="/interview" className="flex items-center gap-3 px-4 py-3 text-[#464555] hover:text-[#3525cd] hover:bg-[#3525cd]/5 transition-all duration-300 rounded-lg">
                    <FiPlay size={18} /><span className="text-sm">Interviews</span>
                </Link>
                <Link href="/resume" className="flex items-center gap-3 px-4 py-3 text-[#464555] hover:text-[#3525cd] hover:bg-[#3525cd]/5 transition-all duration-300 rounded-lg">
                    <FiFileText size={18} /><span className="text-sm">Resume</span>
                </Link>
                <Link href="/recruiter" className="flex items-center gap-3 px-4 py-3 text-[#464555] hover:text-[#3525cd] hover:bg-[#3525cd]/5 transition-all duration-300 rounded-lg">
                    <FiBriefcase size={18} /><span className="text-sm">Recruiter</span>
                </Link>
                <Link href="/arena" className="flex items-center gap-3 px-4 py-3 text-[#464555] hover:text-[#3525cd] hover:bg-[#3525cd]/5 transition-all duration-300 rounded-lg">
                    <FiAward size={18} /><span className="text-sm">Arena</span>
                </Link>
                <div className="relative flex items-center gap-3 px-4 py-3 text-[#3525cd] font-bold border-l-4 border-[#3525cd] bg-[#3525cd]/5 rounded-r-lg mt-4">
                    <FiSettings size={18} /><span className="text-sm">Settings</span>
                </div>
            </nav>
        </aside>
    );

    const tabs = [
        { id: "profile" as const, label: "Profile", icon: <FiUser size={18} /> },
        { id: "password" as const, label: "Password", icon: <FiLock size={18} /> },
        { id: "security" as const, label: "Security", icon: <FiShield size={18} /> },
        { id: "danger" as const, label: "Danger Zone", icon: <FiAlertTriangle size={18} /> },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-[#F8FAFC] text-[#111c2d]">
            <Sidebar />
            <main className="flex-1 ml-0 md:ml-64 h-full overflow-y-auto w-full pt-[72px] px-4 md:px-8 py-8">
                <div className="fade-in max-w-[800px] mx-auto mt-4">

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8 glass-card p-6 rounded-[24px]">
                        <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-[#3525cd] to-[#6C5CE7] shadow-lg shadow-[#3525cd]/30 flex items-center justify-center shrink-0">
                            <FiSettings size={28} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold mb-2 text-[#111c2d]">Settings</h1>
                            <p className="text-sm text-gray-500 font-medium">Manage your profile, password, and account preferences.</p>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? tab.id === "danger"
                                            ? "bg-[#E53E3E] text-white shadow-md shadow-[#E53E3E]/20"
                                            : "bg-[#3525cd] text-white shadow-md shadow-[#3525cd]/20"
                                        : "bg-white border border-gray-200 text-[#464555] hover:border-[#3525cd]/30"
                                }`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* ============ PROFILE TAB ============ */}
                    {activeTab === "profile" && (
                        <div className="glass-card rounded-[24px] p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-bold flex items-center gap-2"><FiUser className="text-[#3525cd]" /> Profile Information</h2>
                                {!editingProfile && (
                                    <button onClick={() => setEditingProfile(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white border border-gray-200 hover:border-[#3525cd]/30 transition-colors">
                                        <FiEdit3 size={14} /> Edit
                                    </button>
                                )}
                            </div>

                            {profileMessage && (
                                <div className={`mb-6 p-4 rounded-xl text-sm font-bold ${profileMessage.type === "success" ? "bg-[#006a61]/10 text-[#006a61]" : "bg-[#E53E3E]/10 text-[#E53E3E]"}`}>
                                    {profileMessage.text}
                                </div>
                            )}

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Full Name</label>
                                    {editingProfile ? (
                                        <input
                                            type="text"
                                            value={profileName}
                                            onChange={e => setProfileName(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/10 outline-none transition-all text-sm font-medium"
                                        />
                                    ) : (
                                        <p className="text-lg font-semibold">{profileName}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Email Address</label>
                                    <p className="text-lg font-semibold text-gray-500">{profileEmail}</p>
                                    <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Experience Level</label>
                                    {editingProfile ? (
                                        <div className="flex gap-3 flex-wrap">
                                            {["Fresher", "Internship Seeker", "Experienced"].map(level => (
                                                <button
                                                    key={level}
                                                    onClick={() => setProfileExperience(level)}
                                                    className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                                                        profileExperience === level
                                                            ? "bg-[#3525cd] text-white shadow-md"
                                                            : "bg-white border border-gray-200 text-[#464555] hover:border-[#3525cd]/50"
                                                    }`}
                                                >
                                                    {level}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-lg font-semibold">{profileExperience}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Member Since</label>
                                        <p className="text-sm font-semibold">{profileCreatedAt ? new Date(profileCreatedAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "—"}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Role</label>
                                        <p className="text-sm font-semibold">{user?.role || "Student"}</p>
                                    </div>
                                </div>

                                {editingProfile && (
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            onClick={handleSaveProfile}
                                            disabled={profileSaving}
                                            className="flex-1 py-3 rounded-xl font-bold bg-[#3525cd] text-white hover:bg-[#281a9c] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#3525cd]/20 disabled:opacity-50"
                                        >
                                            {profileSaving ? <div className="spinner border-t-white" style={{ width: 20, height: 20 }} /> : <><FiSave size={16} /> Save Changes</>}
                                        </button>
                                        <button
                                            onClick={() => { setEditingProfile(false); fetchProfile(); setProfileMessage(null); }}
                                            className="px-6 py-3 rounded-xl font-bold bg-white border border-gray-200 text-[#464555] hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ============ PASSWORD TAB ============ */}
                    {activeTab === "password" && (
                        <div className="glass-card rounded-[24px] p-8">
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-2"><FiLock className="text-[#3525cd]" /> Change Password</h2>
                            <p className="text-sm text-gray-500 mb-8">For security, you cannot reuse any of your last 3 passwords.</p>

                            {passwordMessage && (
                                <div className={`mb-6 p-4 rounded-xl text-sm font-bold ${passwordMessage.type === "success" ? "bg-[#006a61]/10 text-[#006a61]" : "bg-[#E53E3E]/10 text-[#E53E3E]"}`}>
                                    {passwordMessage.text}
                                </div>
                            )}

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Current Password</label>
                                    <div className="relative">
                                        <input
                                            type={showCurrentPassword ? "text" : "password"}
                                            value={currentPassword}
                                            onChange={e => setCurrentPassword(e.target.value)}
                                            placeholder="Enter current password"
                                            className="w-full px-4 py-3 pr-12 rounded-xl bg-white border border-gray-200 focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/10 outline-none transition-all text-sm font-medium"
                                        />
                                        <button onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showCurrentPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            placeholder="Enter new password"
                                            className="w-full px-4 py-3 pr-12 rounded-xl bg-white border border-gray-200 focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/10 outline-none transition-all text-sm font-medium"
                                        />
                                        <button onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showNewPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                        </button>
                                    </div>
                                    {/* Strength Indicator */}
                                    {newPassword.length > 0 && (
                                        <div className="mt-3">
                                            <div className="flex gap-1 mb-1">
                                                {[0, 1, 2, 3, 4].map(i => (
                                                    <div key={i} className="flex-1 h-1.5 rounded-full transition-all" style={{ background: i < pwStrength ? strengthColors[pwStrength - 1] : "#e5e7eb" }} />
                                                ))}
                                            </div>
                                            <p className="text-xs font-bold" style={{ color: strengthColors[pwStrength - 1] || "#9ca3af" }}>
                                                {pwStrength > 0 ? strengthLabels[pwStrength - 1] : "Too short"}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                        className={`w-full px-4 py-3 rounded-xl bg-white border outline-none transition-all text-sm font-medium ${
                                            confirmPassword && confirmPassword !== newPassword
                                                ? "border-[#E53E3E] focus:ring-2 focus:ring-[#E53E3E]/10"
                                                : "border-gray-200 focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/10"
                                        }`}
                                    />
                                    {confirmPassword && confirmPassword !== newPassword && (
                                        <p className="text-xs text-[#E53E3E] font-bold mt-1">Passwords do not match</p>
                                    )}
                                </div>

                                <div className="pt-2">
                                    <p className="text-xs text-gray-400 font-medium mb-1">Last password change: <strong>{profilePasswordUpdatedAt ? new Date(profilePasswordUpdatedAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "Never"}</strong></p>
                                </div>

                                <button
                                    onClick={handleChangePassword}
                                    disabled={passwordChanging || !currentPassword || !newPassword || newPassword !== confirmPassword || pwStrength < 4}
                                    className="w-full py-4 rounded-xl font-bold bg-[#3525cd] text-white hover:bg-[#281a9c] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#3525cd]/20 disabled:opacity-50 disabled:bg-gray-300 disabled:shadow-none"
                                >
                                    {passwordChanging ? <div className="spinner border-t-white" style={{ width: 20, height: 20 }} /> : <><FiCheck size={18} /> Change Password</>}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ============ SECURITY TAB ============ */}
                    {activeTab === "security" && (
                        <div className="glass-card rounded-[24px] p-8 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-[#3525cd] to-[#6C5CE7] shadow-lg shadow-[#3525cd]/30 flex items-center justify-center mb-6">
                                <FiShield size={28} className="text-white" />
                            </div>
                            <h2 className="text-xl font-bold mb-2">Security Dashboard</h2>
                            <p className="text-sm text-gray-500 mb-6 max-w-md">View your active sessions, manage devices, and review recent account activity.</p>
                            <Link
                                href="/settings/security"
                                className="px-8 py-3 rounded-xl font-bold bg-[#3525cd] text-white hover:bg-[#281a9c] transition-colors shadow-lg shadow-[#3525cd]/20 inline-flex items-center gap-2"
                            >
                                <FiShield size={16} /> Open Security Dashboard
                            </Link>
                        </div>
                    )}

                    {/* ============ DANGER ZONE TAB ============ */}
                    {activeTab === "danger" && (
                        <div className="glass-card rounded-[24px] p-8 border-2 border-[#E53E3E]/20">
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-2 text-[#E53E3E]"><FiAlertTriangle /> Danger Zone</h2>
                            <p className="text-sm text-gray-500 mb-8">These actions are irreversible. Please proceed with caution.</p>

                            {deleteMessage && (
                                <div className={`mb-6 p-4 rounded-xl text-sm font-bold ${deleteMessage.type === "success" ? "bg-[#006a61]/10 text-[#006a61]" : "bg-[#E53E3E]/10 text-[#E53E3E]"}`}>
                                    {deleteMessage.text}
                                </div>
                            )}

                            <div className="bg-[#E53E3E]/5 border border-[#E53E3E]/10 rounded-2xl p-6">
                                <h3 className="text-lg font-bold text-[#E53E3E] mb-2 flex items-center gap-2"><FiTrash2 size={18} /> Delete Account</h3>
                                <p className="text-sm text-gray-600 mb-6">
                                    Once you delete your account, all of your data including interviews, reports, resume analyses, and sessions will be permanently removed. This action cannot be undone.
                                </p>

                                {!deleteConfirm ? (
                                    <button
                                        onClick={() => setDeleteConfirm(true)}
                                        className="px-6 py-3 rounded-xl font-bold text-[#E53E3E] bg-white border border-[#E53E3E]/30 hover:bg-[#E53E3E]/5 transition-colors"
                                    >
                                        I want to delete my account
                                    </button>
                                ) : (
                                    <div className="space-y-4">
                                        <p className="text-sm font-bold text-[#E53E3E]">Enter your password to confirm deletion:</p>
                                        <input
                                            type="password"
                                            value={deletePassword}
                                            onChange={e => setDeletePassword(e.target.value)}
                                            placeholder="Enter your password"
                                            className="w-full px-4 py-3 rounded-xl bg-white border border-[#E53E3E]/30 focus:border-[#E53E3E] focus:ring-2 focus:ring-[#E53E3E]/10 outline-none text-sm font-medium"
                                        />
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleDeleteAccount}
                                                disabled={deleting || !deletePassword}
                                                className="flex-1 py-3 rounded-xl font-bold bg-[#E53E3E] text-white hover:bg-[#c53030] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#E53E3E]/20 disabled:opacity-50"
                                            >
                                                {deleting ? <div className="spinner border-t-white" style={{ width: 20, height: 20 }} /> : <><FiTrash2 size={16} /> Permanently Delete</>}
                                            </button>
                                            <button
                                                onClick={() => { setDeleteConfirm(false); setDeletePassword(""); setDeleteMessage(null); }}
                                                className="px-6 py-3 rounded-xl font-bold bg-white border border-gray-200 text-[#464555] hover:bg-gray-50 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}
