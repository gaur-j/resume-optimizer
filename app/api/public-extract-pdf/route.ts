import { NextRequest } from "next/server";
import { handlePdfUpload, jsonError } from "@/lib/pdf-upload";
import { checkPublicRateLimit, publicLimitResponse } from "@/lib/ip-rate-limit";

export const runtime = "nodejs";

const SERVER_ERROR =
  "Something went wrong while reading your resume. Please try again.";

export async function POST(request: NextRequest) {
  // Gate: unauthenticated + CPU-heavy, so limit BEFORE reading the body.
  // Per-IP limits stop one client; the global daily cap bounds total load.
  // Everything after this (size/type checks, parser limits, extraction) is
  // shared with the signed-in route.
  try {
    const limit = await checkPublicRateLimit(
      request,
      "public-extract-pdf",
      [{ max: 10, windowSeconds: 10 * 60 }],
      { max: 10_000, windowSeconds: 24 * 60 * 60 }
    );

    if (!limit.allowed) {
      return publicLimitResponse(
        limit,
        "Too many uploads. Please wait a few minutes or create an account."
      );
    }
  } catch (error) {
    console.error("Public PDF extraction error:", error);
    return jsonError(SERVER_ERROR, 500);
  }

  return handlePdfUpload(request, {
    minTextLength: 50,
    extractionLogLabel: "Public PDF extraction error:",
    uploadLogLabel: "Public PDF extraction error:",
    messages: {
      noFile: "No resume PDF was uploaded.",
      tooLarge: "Your resume is too large. Please upload a PDF under 5 MB.",
      notPdf: "This file doesn't appear to be a valid PDF.",
      unreadable:
        "We couldn't read this PDF. Please upload a text-based resume PDF.",
      tooLittleText:
        "We couldn't find enough readable text in this PDF. Scanned/image resumes aren't supported for the preview.",
      serverError: SERVER_ERROR,
    },
  });
}
