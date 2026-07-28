import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  TailoredResume,
  TailoredResumeChangesSummary,
  TailoredResumeContext,
  TailoredResumeLine,
  TailoredResumeLineType,
  TailoredResumeSection,
} from "@/types/analysis";

export type {
  TailoredResume,
  TailoredResumeChangesSummary,
  TailoredResumeContext,
  TailoredResumeLine,
  TailoredResumeLineType,
  TailoredResumeSection,
} from "@/types/analysis";

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
  userPrompt: string,
  maxTokens = 2048
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
      max_tokens: maxTokens,
      response_format: { type: "json_object" }, // forces valid JSON (Groq supports this on Llama 3.3)
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
 * Strip markdown code fences if the model wraps JSON in them
 */
function cleanJSON(text: string): string {
  // Fixed regex to properly strip Markdown formatting
  return text.replace(/```(?:json)?/gi, "").trim();
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

  // Fixed prompt: Groq's json_object requires an object, so we wrap the array in a "rewrites" key
  const systemPrompt = `You are a professional resume writer. Rewrite the following resume bullet points to be more impactful and aligned with the target role.

For each bullet: start with a strong action verb, include a metric or quantifiable impact, and show relevance to the target role.

Respond with ONLY valid JSON, no markdown:
{
  "rewrites": [
    {
      "original": "Worked on React projects",
      "rewritten_options": ["Led React frontend development for 3+ customer-facing web applications, improving load times by 40%", "Architected React component library used across 5 projects, increasing team velocity by 35%"]
    }
  ]
}`;

  const userPrompt = `CURRENT BULLETS:\n${bulletsText}\n\nTARGET ROLE DESCRIPTION:\n${jobDescription.slice(
    0,
    500
  )}`;
  const responseText = await callAI(systemPrompt, userPrompt);

  try {
    const parsed = JSON.parse(cleanJSON(responseText));
    return (parsed.rewrites || []) as BulletRewriteResult[];
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

const VALID_LINE_TYPES = new Set<TailoredResumeLineType>([
  "contact",
  "subheading",
  "paragraph",
  "bullet",
  "text",
  "spacer",
]);

function renderLineForExport(line: TailoredResumeLine): string {
  if (line.type === "spacer") return "";
  if (line.type === "bullet") {
    const indent = "  ".repeat(line.indent ?? 0);
    return `${indent}• ${line.text}`;
  }
  return line.text;
}

function renderFullText(sections: TailoredResumeSection[]): string {
  return sections
    .map((section) => {
      const body = section.lines.map(renderLineForExport).join("\n");
      return `${section.heading}\n${body}`.trimEnd();
    })
    .join("\n\n");
}

function defaultChangesSummary(): TailoredResumeChangesSummary {
  return {
    bullets_rewritten: 0,
    summary_updated: false,
    skills_updated: false,
  };
}

/**
 * Cheap word-overlap similarity — no new dependency, good enough for
 * "did the model actually change this bullet or just copy it through".
 */
function similarity(a: string, b: string): number {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .trim();

  const aWords = new Set(normalize(a).split(" ").filter(Boolean));
  const bWords = new Set(normalize(b).split(" ").filter(Boolean));

  if (aWords.size === 0 || bWords.size === 0) return 0;

  let overlap = 0;
  for (const w of aWords) if (bWords.has(w)) overlap++;

  return overlap / Math.max(aWords.size, bWords.size);
}

/**
 * Applies known good bullet rewrites if the model failed to actually change them.
 */
function applyBulletRewriteSafeguard(
  sections: TailoredResumeSection[],
  bulletRewrites: BulletRewriteResult[]
): number {
  if (!Array.isArray(bulletRewrites) || bulletRewrites.length === 0) return 0;

  let forcedSubstitutions = 0;

  for (const section of sections) {
    for (const line of section.lines) {
      if (line.type !== "bullet") continue;

      let bestMatch: BulletRewriteResult | null = null;
      let bestScore = 0;

      // 1. Array check was performed at the top of the function
      for (const rewrite of bulletRewrites) {
        // 2. Fixed typo and added safeguard for malformed items
        if (!rewrite || typeof rewrite.original !== "string") continue;

        const score = similarity(line.text, rewrite.original);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = rewrite;
        }
      }

      // Only act when we're confident this line corresponds to a known
      // original bullet AND the model left it essentially unchanged.
      if (bestMatch && bestScore >= 0.6) {
        const stillMatchesOriginal =
          similarity(line.text, bestMatch.original) >= 0.85;
        if (stillMatchesOriginal) {
          const preferred = bestMatch.rewritten_options[0];
          if (preferred?.trim()) {
            line.text = preferred.trim();
            forcedSubstitutions++;
          }
        }
      }
    }
  }

  return forcedSubstitutions;
}

function normalizeTailoredResume(
  raw: Partial<TailoredResume>,
  context: Pick<
    TailoredResumeContext,
    "matchedKeywords" | "missingKeywords" | "bulletRewrites"
  >
): TailoredResume {
  const sections = (raw.sections ?? [])
    .filter((section) => section.heading?.trim())
    .map((section, sectionIndex) => {
      const lines = (section.lines ?? [])
        .filter((line) => line.type === "spacer" || line.text?.trim())
        .map((line, lineIndex) => {
          const type = VALID_LINE_TYPES.has(line.type) ? line.type : "text";

          const normalized: TailoredResumeLine = {
            type,
            text: type === "spacer" ? "" : line.text.trim(),
            order: typeof line.order === "number" ? line.order : lineIndex,
          };

          if (type === "bullet") {
            normalized.indent =
              typeof line.indent === "number" && line.indent >= 0
                ? line.indent
                : 0;
          }

          return normalized;
        })
        .sort((a, b) => a.order - b.order);

      return {
        heading: section.heading.trim(),
        order: typeof section.order === "number" ? section.order : sectionIndex,
        lines,
      };
    })
    .filter((section) => section.lines.length > 0)
    .sort((a, b) => a.order - b.order);

  if (sections.length === 0) {
    throw new Error("Tailored resume has no sections");
  }

  const forcedBulletSubstitutions = applyBulletRewriteSafeguard(
    sections,
    context.bulletRewrites ?? []
  );

  const keywords_added = Array.isArray(raw.keywords_added)
    ? raw.keywords_added.filter((kw) => typeof kw === "string" && kw.trim())
    : [];

  const keywords_matched =
    Array.isArray(raw.keywords_matched) && raw.keywords_matched.length > 0
      ? raw.keywords_matched.filter((kw) => typeof kw === "string" && kw.trim())
      : context.matchedKeywords;

  const keywords_missing =
    Array.isArray(raw.keywords_missing) && raw.keywords_missing.length > 0
      ? raw.keywords_missing.filter((kw) => typeof kw === "string" && kw.trim())
      : context.missingKeywords;

  const changes_summary =
    raw.changes_summary &&
    typeof raw.changes_summary.bullets_rewritten === "number"
      ? {
          bullets_rewritten: raw.changes_summary.bullets_rewritten,
          summary_updated: Boolean(raw.changes_summary.summary_updated),
          skills_updated: Boolean(raw.changes_summary.skills_updated),
        }
      : defaultChangesSummary();

  // Report whichever is higher
  changes_summary.bullets_rewritten = Math.max(
    changes_summary.bullets_rewritten,
    forcedBulletSubstitutions
  );

  const full_text = renderFullText(sections);

  return {
    sections,
    full_text,
    keywords_added,
    keywords_matched,
    keywords_missing,
    changes_summary,
  };
}

function buildTailorSystemPrompt(forceStronger: boolean): string {
  const base = `You are an expert resume editor. Tailor the candidate's resume for the target job.

Return ONLY valid JSON. No markdown, no code fences, no explanation.

STRICT RULES:
1. Preserve every original section name and section order exactly.
2. Preserve chronology within each section (jobs, education, projects - match the source).
3. Never fabricate employers, job titles, dates, degrees, certifications, projects, tools, or metrics.
4. Improve wording only - stronger verbs, clearer phrasing, ATS-friendly terminology.
5. Weave ATS keywords naturally into summary, skills, and bullets ONLY when supported by the original resume.
6. For bullets, use preferred_rewrite when it faithfully matches the original; otherwise rewrite without new facts.
7. Use plain text only in line.text - no markdown, HTML, or special formatting characters.
8. Use line types for PDF export: contact, subheading, paragraph, bullet, text, spacer.
9. Assign sequential "order" fields on sections and lines starting at 0.
10. For nested bullets, set "indent" (0 = top level).`;

  const strongerAddendum = forceStronger
    ? `\n\nIMPORTANT - READ CAREFULLY: A previous attempt at this exact task returned the resume almost completely unchanged. That is a failure. You MUST:
- Rewrite at least 70% of bullet points with stronger action verbs and clearer phrasing than the original.
- If there are missing keywords listed below, naturally add at least 2-3 of them into the summary or skills section, but only where truthful.
- Do not return lines that are character-for-character identical to the original.`
    : "";

  return `${base}${strongerAddendum}

Return exactly this schema:
{
  "sections": [
    {
      "heading": "Experience",
      "order": 0,
      "lines": [
        {
          "type": "subheading",
          "text": "Software Engineer | Acme Corp | Jan 2022 - Present",
          "order": 0
        },
        {
          "type": "bullet",
          "text": "Developed React applications that reduced page load time by 40%.",
          "order": 1,
          "indent": 0
        }
      ]
    }
  ],
  "keywords_added": ["PostgreSQL"],
  "keywords_matched": ["React", "TypeScript"],
  "keywords_missing": ["Docker"],
  "changes_summary": {
    "bullets_rewritten": 3,
    "summary_updated": true,
    "skills_updated": false
  }
}

Do not include "full_text" - it is generated server-side from sections.`;
}

/**
 * Produce a complete tailored resume while preserving structure and facts.
 */
export async function tailorResume(
  resumeText: string,
  jobDescription: string,
  context: TailoredResumeContext
): Promise<TailoredResume> {
  const bulletContext =
    context.bulletRewrites.length > 0
      ? JSON.stringify(
          context.bulletRewrites.map((b) => ({
            original: b.original,
            preferred_rewrite: b.rewritten_options[0] ?? b.original,
          })),
          null,
          2
        )
      : "None";

  const matchedKeywordsContext =
    context.matchedKeywords.length > 0
      ? context.matchedKeywords.join(", ")
      : "None";

  const missingKeywordsContext =
    context.missingKeywords.length > 0
      ? context.missingKeywords.join(", ")
      : "None";

  const userPrompt = `ORIGINAL RESUME:\n${resumeText}\n
TARGET JOB DESCRIPTION:\n${jobDescription}\n
ALREADY MATCHED KEYWORDS (preserve in output):\n${matchedKeywordsContext}\n
MISSING KEYWORDS TO ADD NATURALLY (only where truthful):\n${missingKeywordsContext}\n
BULLET REWRITES TO APPLY (use preferred_rewrite for matching bullets):\n${bulletContext}`;

  async function attempt(forceStronger: boolean): Promise<TailoredResume> {
    const systemPrompt = buildTailorSystemPrompt(forceStronger);
    const responseText = await callAI(systemPrompt, userPrompt, 4096);

    const parsed = JSON.parse(
      cleanJSON(responseText)
    ) as Partial<TailoredResume>;
    return normalizeTailoredResume(parsed, context);
  }

  let result: TailoredResume;

  try {
    result = await attempt(false);
  } catch (error) {
    console.warn("First attempt failed to parse, triggering retry...", error);
    // Updated: Instantly try again if parsing completely fails the first time
    result = await attempt(true);
  }

  if (result) {
    const madeNoRealChanges =
      result.changes_summary.bullets_rewritten === 0 &&
      result.keywords_added.length === 0 &&
      context.missingKeywords.length > 0;

    if (madeNoRealChanges) {
      try {
        console.warn(
          "Tailored resume looked unchanged from the original - retrying with a stronger prompt"
        );
        result = await attempt(true);
      } catch (error) {
        console.error(
          "Retry attempt also failed, keeping first result:",
          error
        );
      }
    }
  }

  return result;
}
