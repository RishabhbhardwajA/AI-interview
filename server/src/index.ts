import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

import connectDB from "./config/db"; // Use config/db as requested

// Import Routers
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import mentorRoutes from "./routes/mentor";
import arenaRoutes from "./routes/arena";
import interviewRoutes from "./routes/interview";
import readinessRoutes from "./routes/readiness";
import recruiterRoutes from "./routes/recruiter";
import resumeRoutes from "./routes/resume";
import settingsRoutes from "./routes/settings";


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000",
    credentials: true,
}));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/mentor", mentorRoutes);
app.use("/api/arena", arenaRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/readiness", readinessRoutes);
app.use("/api/recruiter", recruiterRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/settings", settingsRoutes);

app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok", message: "Express API is running smoothly!" });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("[Express Global Error]:", err);
    res.status(err.status || 500).json({
        error: err.message || "Internal server error",
    });
});

// Start Server
app.listen(PORT, async () => {
    console.log(`[Server]: Express API running on port ${PORT}`);
    
    // Connect to database on startup
    try {
        await connectDB();
        console.log("[Database]: MongoDB connected successfully");
    } catch (error) {
        console.error("[Database]: MongoDB connection failed", error);
    }
});
