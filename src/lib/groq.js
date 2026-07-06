"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GROQ_MODEL = void 0;
exports.evaluateAnswer = evaluateAnswer;
exports.generateInitialQuestion = generateInitialQuestion;
exports.analyzeResume = analyzeResume;
exports.evaluatePlacementReadiness = evaluatePlacementReadiness;
exports.generateCompanyQuestion = generateCompanyQuestion;
exports.evaluateCompanyAnswer = evaluateCompanyAnswer;
exports.generateChallenge = generateChallenge;
exports.evaluateChallengeAnswer = evaluateChallengeAnswer;
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const groqClient = new groq_sdk_1.default({
    apiKey: process.env.GROQ_API_KEY || "",
});
exports.GROQ_MODEL = "llama-3.3-70b-versatile";
async function evaluateAnswer(question, answer, topic, currentDifficulty, interviewContext) {
    const prompt = `You are an expert technical interviewer evaluating a candidate's answer.

INTERVIEW CONTEXT:
- Topic: ${topic}
- Current Difficulty Level: ${currentDifficulty}/5 (1=Easy, 5=Expert)
- Previous Context: ${interviewContext || "This is the first question"}

QUESTION: ${question}

CANDIDATE'S ANSWER: ${answer}

Evaluate the answer and respond in EXACTLY this JSON format (no markdown, no code blocks, just raw JSON):
{
  "score": <number 1-10>,
  "feedback": "<brief constructive feedback, 2-3 sentences max>",
  "difficultyAdjustment": "<'increase' if score >= 7, 'decrease' if score <= 4, 'maintain' otherwise>",
  "followUpQuestion": "<a relevant follow-up question at the adjusted difficulty level for the ${topic} topic>",
  "keyPointsCovered": ["<point1>", "<point2>"],
  "areasToImprove": ["<area1>", "<area2>"]
}

Rules:
- Score 1-3: Poor understanding, decrease difficulty
- Score 4-6: Partial understanding, maintain difficulty  
- Score 7-10: Good/excellent understanding, increase difficulty
- The follow-up question MUST be different from all previous questions
- The follow-up should test deeper knowledge if increasing difficulty
- The follow-up should test fundamentals if decreasing difficulty`;
    try {
        const completion = await groqClient.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: exports.GROQ_MODEL,
            temperature: 0.3,
            max_tokens: 1024,
        });
        const responseText = completion.choices[0]?.message?.content || "";
        // Try to parse JSON from the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                score: Math.min(10, Math.max(1, parsed.score || 5)),
                feedback: parsed.feedback || "No feedback available.",
                difficultyAdjustment: parsed.difficultyAdjustment || "maintain",
                followUpQuestion: parsed.followUpQuestion || "",
                keyPointsCovered: parsed.keyPointsCovered || [],
                areasToImprove: parsed.areasToImprove || [],
            };
        }
        throw new Error("Failed to parse AI response");
    }
    catch (error) {
        console.error("Groq evaluation error:", error);
        return {
            score: 5,
            feedback: "Unable to evaluate answer at this time. Please try again.",
            difficultyAdjustment: "maintain",
            followUpQuestion: "",
            keyPointsCovered: [],
            areasToImprove: [],
        };
    }
}
async function generateInitialQuestion(topic, difficulty = 2) {
    const prompt = `You are an expert technical interviewer. Generate a single interview question.

Topic: ${topic}
Difficulty Level: ${difficulty}/5 (1=Easy Fundamentals, 2=Basic, 3=Intermediate, 4=Advanced, 5=Expert)

Respond with ONLY the question text, nothing else. No numbering, no prefixes, just the plain question.
The question should be open-ended and test the candidate's understanding, not just recall.`;
    try {
        const completion = await groqClient.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: exports.GROQ_MODEL,
            temperature: 0.7,
            max_tokens: 256,
        });
        return completion.choices[0]?.message?.content?.trim() || `Explain the core concepts of ${topic}.`;
    }
    catch (error) {
        console.error("Groq question generation error:", error);
        return `Explain the core concepts of ${topic} and how you have used them in your projects.`;
    }
}
async function analyzeResume(resumeText) {
    const prompt = `You are an expert resume reviewer and career coach. Analyze this resume thoroughly.

RESUME:
${resumeText}

Respond in EXACTLY this JSON format (no markdown, no code blocks, just raw JSON):
{
  "overallScore": <number 1-100>,
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "weaknesses": ["<weakness1>", "<weakness2>"],
  "suggestions": ["<actionable suggestion 1>", "<actionable suggestion 2>", "<actionable suggestion 3>"],
  "keywords": ["<relevant keyword 1>", "<keyword 2>", "<keyword 3>"],
  "summary": "<2-3 sentence overall assessment>"
}`;
    try {
        const completion = await groqClient.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: exports.GROQ_MODEL,
            temperature: 0.3,
            max_tokens: 1024,
        });
        const responseText = completion.choices[0]?.message?.content || "";
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                overallScore: Math.min(100, Math.max(0, parsed.overallScore || 50)),
                strengths: parsed.strengths || [],
                weaknesses: parsed.weaknesses || [],
                suggestions: parsed.suggestions || [],
                keywords: parsed.keywords || [],
                summary: parsed.summary || "Unable to generate summary.",
            };
        }
        throw new Error("Failed to parse AI response");
    }
    catch (error) {
        console.error("Groq resume analysis error:", error);
        return {
            overallScore: 0,
            strengths: [],
            weaknesses: [],
            suggestions: ["Please try again with a valid resume."],
            keywords: [],
            summary: "Unable to analyze resume at this time.",
        };
    }
}
async function evaluatePlacementReadiness(experienceLevel, resumeData, interviewHistoryData) {
    const prompt = `You are an expert AI Career Coach and Technical Recruiter. Assess this candidate's placement readiness.

CANDIDATE EXPERIENCE LEVEL: ${experienceLevel}

RESUME ANALYSIS SNAPSHOT:
${resumeData || "No resume provided."}

INTERVIEW HISTORY SNAPSHOT (recent performances):
${interviewHistoryData || "No interview history provided yet."}

Based on this combined data, calculate an overall placement readiness score (0-100) and generate a strategic roadmap.
The category must be EXACTLY ONE of: "Placement Ready", "Needs Improvement", or "High Potential Candidate".
Tailor the roadmap strictly to their experience level (${experienceLevel}).

Respond in EXACTLY this JSON format (no markdown, no code blocks):
{
  "score": <number 0-100>,
  "category": "<Placement Ready | Needs Improvement | High Potential Candidate>",
  "weakAreas": ["<area 1>", "<area 2>"],
  "missingSkills": ["<skill 1>", "<skill 2>"],
  "roadmap": {
    "technologies": ["<tech 1>", "<tech 2>"],
    "projects": ["<project idea 1>", "<project idea 2>"],
    "certifications": ["<cert 1>", "<cert 2>"],
    "topics": ["<interview topic 1>", "<interview topic 2>"]
  }
}`;
    try {
        const completion = await groqClient.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.1-70b-versatile",
            temperature: 0.3,
            max_tokens: 1024,
            response_format: { type: "json_object" }
        });
        const responseText = completion.choices[0]?.message?.content || "";
        const parsed = JSON.parse(responseText);
        return {
            score: Math.min(100, Math.max(0, parsed.score || 50)),
            category: parsed.category || "Needs Improvement",
            weakAreas: parsed.weakAreas || [],
            missingSkills: parsed.missingSkills || [],
            roadmap: {
                technologies: parsed.roadmap?.technologies || [],
                projects: parsed.roadmap?.projects || [],
                certifications: parsed.roadmap?.certifications || [],
                topics: parsed.roadmap?.topics || [],
            }
        };
    }
    catch (error) {
        console.error("Groq placement readiness error:", error);
        return {
            score: 0,
            category: "Needs Improvement",
            weakAreas: ["Unable to analyze"],
            missingSkills: ["Unable to analyze"],
            roadmap: {
                technologies: [],
                projects: [],
                certifications: [],
                topics: [],
            }
        };
    }
}
async function generateCompanyQuestion(companyName, interviewStyle, focusAreas, questionPatterns, topic, difficulty, previousQuestions) {
    const prevQList = previousQuestions.length > 0
        ? `\nPreviously asked questions (DO NOT repeat these):\n${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
        : "";
    const prompt = `You are simulating a real interview at ${companyName}.

COMPANY INTERVIEW STYLE:
${interviewStyle}

FOCUS AREAS: ${focusAreas.join(", ")}

QUESTION PATTERNS EXAMPLES: ${questionPatterns.join("; ")}

TOPIC: ${topic || "General technical"}
DIFFICULTY: ${difficulty}/5 (1=Easy, 5=Expert)
${prevQList}

Generate a single interview question that ${companyName} would actually ask in their hiring process.
The question should match their interview style and difficulty level.
Respond with ONLY the question text, nothing else. No numbering, no prefixes.`;
    try {
        const completion = await groqClient.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: exports.GROQ_MODEL,
            temperature: 0.7,
            max_tokens: 300,
        });
        return completion.choices[0]?.message?.content?.trim() || `Explain a concept relevant to ${topic} as ${companyName} would expect.`;
    }
    catch (error) {
        console.error("Groq company question generation error:", error);
        return `Explain the core concepts of ${topic} as expected in a ${companyName} interview.`;
    }
}
async function evaluateCompanyAnswer(question, answer, companyName, interviewStyle, evaluationCriteria, passingThreshold, topic, currentDifficulty, interviewContext) {
    const prompt = `You are a senior interviewer at ${companyName} evaluating a candidate's answer.

COMPANY: ${companyName}
INTERVIEW STYLE: ${interviewStyle}

EVALUATION CRITERIA FOR ${companyName.toUpperCase()}:
${evaluationCriteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}

PASSING THRESHOLD: ${passingThreshold}/10 (candidate needs at least this score to meet ${companyName}'s hiring bar)

Topic: ${topic || "General"}
Current Difficulty: ${currentDifficulty}/5
Previous Context: ${interviewContext || "First question"}

QUESTION: ${question}

CANDIDATE'S ANSWER: ${answer}

Evaluate this answer AS ${companyName} WOULD and respond in EXACTLY this JSON format (no markdown, no code blocks):
{
  "score": <number 1-10>,
  "feedback": "<constructive feedback in ${companyName}'s evaluation style, 2-3 sentences>",
  "difficultyAdjustment": "<'increase' if score >= 7, 'decrease' if score <= 4, 'maintain' otherwise>",
  "followUpQuestion": "<a follow-up question ${companyName} would ask next at the adjusted difficulty>",
  "keyPointsCovered": ["<point1>", "<point2>"],
  "areasToImprove": ["<area1>", "<area2>"],
  "meetsCompanyBar": <true if score >= ${passingThreshold}, false otherwise>,
  "companySpecificFeedback": "<1-2 sentences about how this answer aligns with ${companyName}'s specific expectations and culture>"
}`;
    try {
        const completion = await groqClient.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: exports.GROQ_MODEL,
            temperature: 0.3,
            max_tokens: 1024,
        });
        const responseText = completion.choices[0]?.message?.content || "";
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                score: Math.min(10, Math.max(1, parsed.score || 5)),
                feedback: parsed.feedback || "No feedback available.",
                difficultyAdjustment: parsed.difficultyAdjustment || "maintain",
                followUpQuestion: parsed.followUpQuestion || "",
                keyPointsCovered: parsed.keyPointsCovered || [],
                areasToImprove: parsed.areasToImprove || [],
                meetsCompanyBar: parsed.meetsCompanyBar ?? (parsed.score >= passingThreshold),
                companySpecificFeedback: parsed.companySpecificFeedback || "",
            };
        }
        throw new Error("Failed to parse AI response");
    }
    catch (error) {
        console.error("Groq company evaluation error:", error);
        return {
            score: 5,
            feedback: "Unable to evaluate answer at this time.",
            difficultyAdjustment: "maintain",
            followUpQuestion: "",
            keyPointsCovered: [],
            areasToImprove: [],
            meetsCompanyBar: false,
            companySpecificFeedback: "",
        };
    }
}
async function generateChallenge(category, difficulty, type) {
    const categoryContext = {
        technical: "Data structures, algorithms, system design, coding concepts, software engineering principles",
        hr: "Behavioral questions, leadership, teamwork, conflict resolution, career goals, strengths/weaknesses, STAR method scenarios",
        aptitude: "Logical reasoning, analytical thinking, problem-solving patterns, mathematical reasoning, data interpretation",
        "domain-specific": "Web development, cloud computing, databases, DevOps, mobile development, AI/ML concepts, or any specialized domain",
    };
    const prompt = `You are creating a ${type} interview challenge for a competitive platform.

CATEGORY: ${category}
CONTEXT: ${categoryContext[category] || "General technical topics"}
DIFFICULTY: ${difficulty}/5 (1=Easy, 5=Expert)
TYPE: ${type === "daily" ? "Quick daily challenge" : "Comprehensive weekly challenge"}
NUMBER OF QUESTIONS: 5

Generate a challenge with a catchy title, brief description, and exactly 5 questions.
Each question should have expected key topics for evaluation.

Respond in EXACTLY this JSON format (no markdown, no code blocks):
{
  "title": "<catchy challenge title>",
  "description": "<1-2 sentence description of what this challenge tests>",
  "questions": [
    { "question": "<question text>", "expectedTopics": ["<topic1>", "<topic2>"] },
    { "question": "<question text>", "expectedTopics": ["<topic1>", "<topic2>"] },
    { "question": "<question text>", "expectedTopics": ["<topic1>", "<topic2>"] },
    { "question": "<question text>", "expectedTopics": ["<topic1>", "<topic2>"] },
    { "question": "<question text>", "expectedTopics": ["<topic1>", "<topic2>"] }
  ]
}

Rules:
- Questions should progressively increase in difficulty
- Title should be engaging (e.g., "Algorithm Gauntlet", "Leadership Lightning Round")
- Questions must be open-ended, not MCQ
- Each question must be unique and test different aspects of the category`;
    try {
        const completion = await groqClient.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: exports.GROQ_MODEL,
            temperature: 0.7,
            max_tokens: 1500,
            response_format: { type: "json_object" },
        });
        const responseText = completion.choices[0]?.message?.content || "";
        const parsed = JSON.parse(responseText);
        return {
            title: parsed.title || `${category} Challenge`,
            description: parsed.description || `Test your ${category} skills!`,
            questions: (parsed.questions || []).slice(0, 5).map((q) => ({
                question: q.question || "Explain a key concept.",
                expectedTopics: q.expectedTopics || [],
            })),
        };
    }
    catch (error) {
        console.error("Groq challenge generation error:", error);
        return {
            title: `${category.charAt(0).toUpperCase() + category.slice(1)} Challenge`,
            description: `Test your ${category} knowledge with this ${type} challenge!`,
            questions: [
                { question: `Explain a fundamental concept in ${category}.`, expectedTopics: [category] },
                { question: `Describe a real-world application of ${category} principles.`, expectedTopics: [category] },
                { question: `What are common challenges in ${category}?`, expectedTopics: [category] },
                { question: `Compare two approaches in ${category} and their trade-offs.`, expectedTopics: [category] },
                { question: `How would you solve a complex ${category} problem?`, expectedTopics: [category] },
            ],
        };
    }
}
async function evaluateChallengeAnswer(question, answer, expectedTopics, category) {
    const prompt = `You are a judge in a competitive interview challenge arena.
Evaluate this answer quickly and fairly.

CATEGORY: ${category}
QUESTION: ${question}
EXPECTED TOPICS: ${expectedTopics.join(", ")}
CANDIDATE'S ANSWER: ${answer}

Respond in EXACTLY this JSON format (no markdown):
{
  "score": <number 1-10>,
  "feedback": "<brief 1-2 sentence feedback>"
}

Be strict but fair. Score based on accuracy, depth, and coverage of expected topics.`;
    try {
        const completion = await groqClient.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: exports.GROQ_MODEL,
            temperature: 0.2,
            max_tokens: 256,
        });
        const responseText = completion.choices[0]?.message?.content || "";
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                score: Math.min(10, Math.max(1, parsed.score || 5)),
                feedback: parsed.feedback || "No feedback available.",
            };
        }
        throw new Error("Parse error");
    }
    catch (error) {
        console.error("Groq challenge eval error:", error);
        return { score: 5, feedback: "Unable to evaluate at this time." };
    }
}
exports.default = groqClient;
