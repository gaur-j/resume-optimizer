import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const GROQ_MODEL = "llama-3.3-70b-versatile"; // best free Groq model for structured tasks
const GEMINI_MODEL = "gemini-2.5-flash-lite"; // most generous free Gemini tier as of 2026

export interface ATSAnalysisResult {
  overall_score: number;
  sections: {
    keywords: number;
    experience: number;
    formatting: number;
    skills: number;
  };
  matched_keywords: string[];
  missing_keywords: string[];
  critical_issues: string[];
  quick_wins: string[];
}

export interface BulletRewriteResult {
  original: string;
  rewritten_options: string[];
}

export interface SummaryResult {
  summary: string;
}

/**
 * Core call wrapper: tries Groq first, falls back to Gemini on 429/rate-limit.
 * This keeps your app working even if Groq's free tier gets hit hard during a traffic spike.
 */
async function callAI(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  // --- Try Groq first ---
  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2048,
      response_format: { type: "json_object" }, // forces valid JSON — Groq supports this on Llama 3.3
    });

    const text = completion.choices[0]?.message?.content;
    if (text) return text;
    throw new Error("Empty Groq response");
  } catch (err: unknown) {
    const isRateLimit =
      err instanceof Error &&
      (err.message.includes("429") ||
        err.message.toLowerCase().includes("rate limit"));

    if (!isRateLimit) {
      console.error("Groq error (non-rate-limit):", err);
    } else {
      console.warn("Groq rate-limited, falling back to Gemini...");
    }

    // --- Fallback to Gemini ---
    try {
      const model = genAI.getGenerativeModel({
        model: GEMINI_MODEL,
        systemInstruction: systemPrompt,
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      });

      const result = await model.generateContent(userPrompt);
      const text = result.response.text();
      if (text) return text;
      throw new Error("Empty Gemini response");
    } catch (fallbackErr) {
      console.error("Gemini fallback also failed:", fallbackErr);
      throw new Error(
        "Both AI providers are unavailable right now. Please try again in a minute."
      );
    }
  }
}

/**
 * Strip markdown code fences if the model wraps JSON in ```json ... ```
 * (Gemini sometimes does this even when asked not to)
 */
function cleanJSON(text: string): string {
  return text.replace(/```json\s*|\s*```/g, "").trim();
}

/**
 * Analyze resume against job description for ATS score
 */
export async function analyzeATS(
  resumeText: string,
  jobDescription: string
): Promise<ATSAnalysisResult> {
  const systemPrompt = `You are an ATS (Applicant Tracking System) expert and resume analyst. Analyze the provided resume against the job description.

Respond with ONLY valid JSON, no markdown, no code blocks, no explanation:

{
  "overall_score": 72,
  "sections": {
    "keywords": 68,
    "experience": 75,
    "formatting": 80,
    "skills": 65
  },
  "matched_keywords": ["React", "Node.js", "TypeScript"],
  "missing_keywords": ["AWS", "Docker", "PostgreSQL"],
  "critical_issues": ["No quantified achievements", "Missing LinkedIn URL"],
  "quick_wins": ["Add 3 missing keywords to skills section", "Quantify at least 2 bullet points with metrics"]
}`;

  const userPrompt = `RESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription}`;

  const responseText = await callAI(systemPrompt, userPrompt);

  try {
    return JSON.parse(cleanJSON(responseText)) as ATSAnalysisResult;
  } catch (error) {
    console.error("Failed to parse ATS response:", responseText);
    throw new Error("Failed to parse ATS analysis response");
  }
}

/**
 * Rewrite weak resume bullets to be more impactful
 */
export async function rewriteBullets(
  bullets: string[],
  jobDescription: string
): Promise<BulletRewriteResult[]> {
  const bulletsText = bullets.map((b, i) => `${i + 1}. ${b}`).join("\n");

  const systemPrompt = `You are a professional resume writer. Rewrite the following resume bullet points to be more impactful and aligned with the target role.

For each bullet: start with a strong action verb, include a metric or quantifiable impact, and show relevance to the target role.

Respond with ONLY valid JSON, no markdown:

[
  {
    "original": "Worked on React projects",
    "rewritten_options": ["Led React frontend development for 3+ customer-facing web applications, improving load times by 40%", "Architected React component library used across 5 projects, increasing team velocity by 35%"]
  }
]`;

  const userPrompt = `CURRENT BULLETS:\n${bulletsText}\n\nTARGET ROLE DESCRIPTION:\n${jobDescription.slice(
    0,
    500
  )}`;

  const responseText = await callAI(systemPrompt, userPrompt);

  try {
    return JSON.parse(cleanJSON(responseText)) as BulletRewriteResult[];
  } catch (error) {
    console.error("Failed to parse bullets response:", responseText);
    throw new Error("Failed to parse bullet rewrite response");
  }
}

/**
 * Generate a professional summary optimized for ATS
 */
export async function generateSummary(
  resumeText: string,
  jobDescription: string
): Promise<SummaryResult> {
  const systemPrompt = `You are a professional resume writer. Generate a 3-4 line professional summary (50-80 words) that matches the target role, uses keywords from the job description, and is optimized for ATS scanning.

Respond with ONLY valid JSON:
{
  "summary": "Results-driven full-stack developer with 5+ years building scalable web applications using React and Node.js..."
}`;

  const userPrompt = `RESUME:\n${resumeText}\n\nTARGET ROLE:\n${jobDescription.slice(
    0,
    400
  )}`;

  const responseText = await callAI(systemPrompt, userPrompt);

  try {
    return JSON.parse(cleanJSON(responseText)) as SummaryResult;
  } catch (error) {
    console.error("Failed to parse summary response:", responseText);
    throw new Error("Failed to parse summary response");
  }
}
