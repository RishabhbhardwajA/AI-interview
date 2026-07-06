import mongoose, { Schema, Document, Model } from "mongoose";
import * as bcrypt from "bcryptjs";

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    role: "Student" | "Mentor" | "Administrator";
    experienceLevel: "Fresher" | "Internship Seeker" | "Experienced";
    provider: string;
    providerId?: string;
    avatar?: string;
    readinessHistory: {
        score: number;
        category: string;
        roadmap: {
            technologies: string[];
            projects: string[];
            certifications: string[];
            topics: string[];
        };
        weakAreas: string[];
        missingSkills: string[];
        createdAt: Date;
    }[];
    // Security fields
    isEmailVerified: boolean;
    verificationToken?: string;
    verificationExpires?: Date;
    failedLoginAttempts: number;
    lockoutUntil?: Date;
    passwordUpdatedAt: Date;
    passwordHistory: string[];
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema<IUser> = new Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: [2, "Name must be at least 2 characters"],
            maxlength: [50, "Name cannot exceed 50 characters"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
        },
        password: {
            type: String,
            minlength: [6, "Password must be at least 6 characters"],
        },
        provider: {
            type: String,
            default: "local",
        },
        providerId: {
            type: String,
        },
        avatar: {
            type: String,
        },
        role: {
            type: String,
            enum: ["Student", "Mentor", "Administrator"],
            default: "Student",
        },
        experienceLevel: {
            type: String,
            enum: ["Fresher", "Internship Seeker", "Experienced"],
            default: "Fresher",
        },
        readinessHistory: [
            {
                score: Number,
                category: String,
                roadmap: {
                    technologies: [String],
                    projects: [String],
                    certifications: [String],
                    topics: [String],
                },
                weakAreas: [String],
                missingSkills: [String],
                createdAt: { type: Date, default: Date.now },
            },
        ],
        // Security fields
        isEmailVerified: { type: Boolean, default: false },
        verificationToken: { type: String },
        verificationExpires: { type: Date },
        failedLoginAttempts: { type: Number, default: 0 },
        lockoutUntil: { type: Date },
        passwordUpdatedAt: { type: Date, default: Date.now },
        passwordHistory: { type: [String], default: [] },
        resetPasswordToken: { type: String },
        resetPasswordExpires: { type: Date },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
UserSchema.pre("save", async function (this: any) {
    if (!this.isModified("password")) {
        return;
    }
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
UserSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

// Prevent model recompilation in dev
const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
