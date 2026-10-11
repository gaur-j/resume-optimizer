import { NextRequest, NextResponse } from "next/server";
import { analyzeATS } from "@/lib/ai";
import {
  MAX_JD_CHARS,
  MAX_JSON_BODY_BYTES,
  MAX_RESUME_CHARS,
} from "@/lib/limits";
import { PayloadTooLargeError, readLimitedJson } from "@/lib/request-body";
import { checkPublicRateLimit, publicLimitResponse } from "@/lib/ip-rate-limit";

export const runtime = "nodejs";

const MAX_RESUME_LENGTH = MAX_RESUME_CHARS;
const MAX_JD_LENGTH = MAX_JD_CHARS;

// Unauthenticated + paid LLM call, so limits live in Postgres (shared by every
// serverless instance) rather than in per-instance memory. Per-IP burst and
// daily limits stop one client; the GLOBAL daily cap is the cost kill-switch
// that holds even against an attacker rotating through many IPs.
const PER_IP_LIMITS = [
  { max: 3, windowSeconds: 10 * 60 },
  { max: 10, windowSeconds: 24 * 60 * 60 },
];
const GLOBAL_DAILY_LIMIT = { max: 3_000, windowSeconds: 24 * 60 * 60 };

function normalizeInput(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  if (!normalized || normalized.length > maxLength) {
    return null;
  }

  return normalized;
}

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await checkPublicRateLimit(
      request,
      "preview-score",
      PER_IP_LIMITS,
      GLOBAL_DAILY_LIMIT
    );

    if (!rateLimit.allowed) {
      return publicLimitResponse(
        rateLimit,
        "You've reached the free preview limit. Create an account to continue."
      );
    }

    const body = (await readLimitedJson(request, MAX_JSON_BODY_BYTES)) as {
      resume_text?: unknown;
      jd_text?: unknown;
    } | null;

    const resumeText = normalizeInput(body?.resume_text, MAX_RESUME_LENGTH);

    const jobDescription = normalizeInput(body?.jd_text, MAX_JD_LENGTH);

    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        {
          error: "Resume text and job description are required.",
        },
        { status: 400 }
      );
    }

    if (resumeText.length < 50) {
      return NextResponse.json(
        {
          error:
            "Your resume doesn't contain enough text for a reliable preview.",
        },
        { status: 400 }
      );
    }

    if (jobDescription.length < 50) {
      return NextResponse.json(
        {
          error:
            "Please provide the full job description for a useful ATS score.",
        },
        { status: 400 }
      );
    }

    const result = await analyzeATS(resumeText, jobDescription);

    return NextResponse.json({
      success: true,
      data: {
        overall_score: result.overall_score,
        sections: result.sections,
        matched_keyword_count: result.matched_keywords.length,
        missing_keyword_count: result.missing_keywords.length,
      },
    });
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return NextResponse.json(
        { error: "Your resume or job description is too long." },
        { status: 413 }
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    console.error("Public ATS preview error:", error);

    return NextResponse.json(
      {
        error:
          "We couldn't calculate your ATS preview right now. Please try again.",
      },
      { status: 500 }
    );
  }
}
