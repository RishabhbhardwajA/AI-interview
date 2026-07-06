import { Router, Request, Response } from "express";
import { authenticateToken } from "../middleware/auth";
import { analyzeResume } from "../../src/lib/groq";

const router = Router();
router.use(authenticateToken);

router.post("/", async (req: Request, res: Response): Promise<void> => {
    try {
        const { resumeText } = req.body;
        const cleanText = resumeText?.replace(/\s+/g, '');
        
        if (!cleanText || cleanText.length < 50) {
            res.status(400).json({ error: "The PDF appears to be empty, an image, or contains too little text (minimum 50 characters required)." });
            return;
        }

        const analysis = await analyzeResume(resumeText);
        res.json({ message: "Resume analyzed successfully", analysis });
    } catch (error: any) {
        console.error("Resume API error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
