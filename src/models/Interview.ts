import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuestion {
    question: string;
    answer: string;
    score: number;
    difficulty: number;
    feedback: string;
    timeTaken: number;
    skipped: boolean;
}

export interface IInterview extends Document {
    userId: mongoose.Types.ObjectId;
    topic: string;
    questions: IQuestion[];
    currentDifficulty: number;
    status: "in-progress" | "completed";
    totalScore: number;
    averageScore: number;
    peakDifficulty: number;
    totalQuestions: number;
    company?: string;
    interviewMode: "general" | "recruiter";
    mentorFeedback?: string;
    reviewedBy?: mongoose.Types.ObjectId;
    proctoringWarnings: number;
    isCheatingDetected: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
    question: { type: String, required: true },
    answer: { type: String, default: "" },
    score: { type: Number, default: 0, min: 0, max: 10 },
    difficulty: { type: Number, required: true, min: 1, max: 5 },
    feedback: { type: String, default: "" },
    timeTaken: { type: Number, default: 0 },
    skipped: { type: Boolean, default: false },
});

const InterviewSchema: Schema<IInterview> = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
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
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        proctoringWarnings: { type: Number, default: 0 },
        isCheatingDetected: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    }
);

const Interview: Model<IInterview> =
    mongoose.models.Interview ||
    mongoose.model<IInterview>("Interview", InterviewSchema);

export default Interview;
