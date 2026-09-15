import { NextRequest, NextResponse } from "next/server";
import { analyzeATS } from "@/lib/ai";

export const runtime = "nodejs";

const MAX_RESUME_LENGTH = 30_000;
const MAX_JD_LENGTH = 20_000;

// Lightweight protection against accidental abuse.
// This is intentionally separate from the authenticated analysis rate limit.
const requestBuckets = new Map<string, { count: number; resetAt: number }>();

const MAX_REQUESTS = 3;
const WINDOW_MS = 10 * 60 * 1000;

function getClientKey(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    "anonymous"
  );
}

function checkPublicRateLimit(key: string) {
  const now = Date.now();
  const current = requestBuckets.get(key);

  if (!current || now >= current.resetAt) {
    requestBuckets.set(key, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });

    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  }

  if (current.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000),
    };
  }

  current.count += 1;

  return {
    allowed: true,
    retryAfterSeconds: 0,
  };
}

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
    const clientKey = getClientKey(request);
    const rateLimit = checkPublicRateLimit(clientKey);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error:
            "You've reached the free preview limit. Create an account to continue.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

    const body = await request.json();

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
