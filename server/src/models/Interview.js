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
const mongoose_1 = __importStar(require("mongoose"));
const QuestionSchema = new mongoose_1.Schema({
    question: { type: String, required: true },
    answer: { type: String, default: "" },
    score: { type: Number, default: 0, min: 0, max: 10 },
    difficulty: { type: Number, required: true, min: 1, max: 5 },
    feedback: { type: String, default: "" },
    timeTaken: { type: Number, default: 0 },
    skipped: { type: Boolean, default: false },
});
const InterviewSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    topic: {
        type: String,
        required: [true, "Interview topic is required"],
        trim: true,
    },
    questions: [QuestionSchema],
    currentDifficulty: {
        type: Number,
        default: 2,
        min: 1,
        max: 5,
    },
    status: {
        type: String,
        enum: ["in-progress", "completed"],
        default: "in-progress",
    },
    totalScore: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    peakDifficulty: { type: Number, default: 2 },
    totalQuestions: { type: Number, default: 10 },
    company: { type: String, default: "" },
    interviewMode: {
        type: String,
        enum: ["general", "recruiter"],
        default: "general",
    },
    mentorFeedback: { type: String, default: "" },
    reviewedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
    },
    proctoringWarnings: { type: Number, default: 0 },
    isCheatingDetected: { type: Boolean, default: false },
}, {
    timestamps: true,
});
const Interview = mongoose_1.default.models.Interview ||
    mongoose_1.default.model("Interview", InterviewSchema);
exports.default = Interview;
