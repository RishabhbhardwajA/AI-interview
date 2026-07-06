"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BADGE_DEFINITIONS = void 0;
exports.calculateRank = calculateRank;
exports.getRankIcon = getRankIcon;
const mongoose_1 = __importStar(require("mongoose"));
const BadgeSchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    icon: { type: String, required: true },
    description: { type: String, required: true },
    unlockedAt: { type: Date, default: Date.now },
});
const RankHistorySchema = new mongoose_1.Schema({
    rank: { type: String, required: true },
    date: { type: Date, default: Date.now },
    points: { type: Number, required: true },
});
const UserStatsSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    totalPoints: { type: Number, default: 0 },
    currentRank: { type: String, default: "Bronze" },
    badges: [BadgeSchema],
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: null },
    challengesCompleted: { type: Number, default: 0 },
    challengesByCategory: {
        technical: { type: Number, default: 0 },
        hr: { type: Number, default: 0 },
        aptitude: { type: Number, default: 0 },
        domainSpecific: { type: Number, default: 0 },
    },
    rankHistory: [RankHistorySchema],
    weeklyPoints: { type: Number, default: 0 },
    monthlyPoints: { type: Number, default: 0 },
    weekStartDate: { type: Date, default: null },
    monthStartDate: { type: Date, default: null },
}, {
    timestamps: true,
});
UserStatsSchema.index({ totalPoints: -1 });
UserStatsSchema.index({ weeklyPoints: -1 });
// Rank calculation helper
function calculateRank(points) {
    if (points >= 1000)
        return "Diamond";
    if (points >= 600)
        return "Platinum";
    if (points >= 300)
        return "Gold";
    if (points >= 100)
        return "Silver";
    return "Bronze";
}
function getRankIcon(rank) {
    const icons = {
        Bronze: "🥉",
        Silver: "🥈",
        Gold: "🥇",
        Platinum: "💎",
        Diamond: "👑",
    };
    return icons[rank] || "🥉";
}
// Badge definitions
exports.BADGE_DEFINITIONS = [
    { id: "first_blood", name: "First Blood", icon: "🔥", description: "Complete your first challenge" },
    { id: "speed_demon", name: "Speed Demon", icon: "⚡", description: "Complete a challenge in under 5 minutes" },
    { id: "perfect_score", name: "Perfect Score", icon: "🎯", description: "Score 10/10 on any question" },
    { id: "week_warrior", name: "Week Warrior", icon: "📅", description: "Maintain a 7-day streak" },
    { id: "monthly_master", name: "Monthly Master", icon: "🏆", description: "Maintain a 30-day streak" },
    { id: "tech_titan", name: "Technical Titan", icon: "🧠", description: "Complete 10 technical challenges" },
    { id: "hr_hero", name: "HR Hero", icon: "💬", description: "Complete 10 HR challenges" },
    { id: "aptitude_ace", name: "Aptitude Ace", icon: "🧮", description: "Complete 10 aptitude challenges" },
    { id: "all_rounder", name: "All-Rounder", icon: "⭐", description: "Complete challenges in all 4 categories" },
    { id: "top_3", name: "Top 3 Finish", icon: "👑", description: "Rank in top 3 on any challenge" },
];
const UserStats = mongoose_1.default.models.UserStats ||
    mongoose_1.default.model("UserStats", UserStatsSchema);
exports.default = UserStats;
