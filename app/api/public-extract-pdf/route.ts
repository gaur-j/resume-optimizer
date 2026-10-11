import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPDF, PdfLimitError } from "@/lib/pdf";
import { MAX_PDF_BYTES, MULTIPART_OVERHEAD_BYTES } from "@/lib/limits";
import { PayloadTooLargeError, readLimitedFormData } from "@/lib/request-body";
import { checkPublicRateLimit, publicLimitResponse } from "@/lib/ip-rate-limit";

export const runtime = "nodejs";

const MAX_FILE_SIZE = MAX_PDF_BYTES;
const MIN_TEXT_LENGTH = 50;

function isPdfSignature(bytes: Uint8Array) {
  return (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  );
}

function normalizeExtractedText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    // Unauthenticated + CPU-heavy: limit BEFORE reading the body. Per-IP
    // limits stop one client; the global daily cap bounds total load.
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

    const formData = await readLimitedFormData(
      request,
      MAX_FILE_SIZE + MULTIPART_OVERHEAD_BYTES
    );

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError("No resume PDF was uploaded.", 400);
    }

    if (file.size === 0) {
      return jsonError("The uploaded file is empty.", 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return jsonError(
        "Your resume is too large. Please upload a PDF under 5 MB.",
        400
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    if (!isPdfSignature(bytes)) {
      return jsonError("This file doesn't appear to be a valid PDF.", 400);
    }

    let extractedText: string;

    try {
      extractedText = await extractTextFromPDF(Buffer.from(bytes));
    } catch (error) {
      console.error("Public PDF extraction error:", error);

      if (error instanceof PdfLimitError) {
        return jsonError(error.message, 422);
      }

      return jsonError(
        "We couldn't read this PDF. Please upload a text-based resume PDF.",
        422
      );
    }

    const normalizedText = normalizeExtractedText(extractedText);

    if (normalizedText.length < MIN_TEXT_LENGTH) {
      return jsonError(
        "We couldn't find enough readable text in this PDF. Scanned/image resumes aren't supported for the preview.",
        422
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        text: normalizedText,
      },
    });
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return jsonError(
        "Your resume is too large. Please upload a PDF under 5 MB.",
        413
      );
    }

    console.error("Public PDF extraction error:", error);

    return jsonError(
      "Something went wrong while reading your resume. Please try again.",
      500
    );
  }
}
