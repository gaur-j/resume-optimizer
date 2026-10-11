import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { extractTextFromPDF, PdfLimitError } from "@/lib/pdf";
import { MAX_PDF_BYTES, MULTIPART_OVERHEAD_BYTES } from "@/lib/limits";
import { PayloadTooLargeError, readLimitedFormData } from "@/lib/request-body";

export const runtime = "nodejs";

const MAX_FILE_SIZE = MAX_PDF_BYTES;
const MIN_TEXT_LENGTH = 20;

function isPdfSignature(bytes: Uint8Array) {
  // PDF files start with "%PDF-"
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
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const formData = await readLimitedFormData(
      request,
      MAX_FILE_SIZE + MULTIPART_OVERHEAD_BYTES
    );
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError("No file was uploaded.", 400);
    }

    if (file.size === 0) {
      return jsonError("The uploaded file is empty.", 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return jsonError(
        "File is too large. Please upload a PDF under 5 MB.",
        400
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    if (!isPdfSignature(bytes)) {
      return jsonError(
        "This file doesn't appear to be a valid PDF. Please upload the original PDF resume.",
        400
      );
    }

    let extractedText: string;

    try {
      extractedText = await extractTextFromPDF(Buffer.from(bytes));
    } catch (error) {
      console.error("PDF extraction error:", error);

      if (error instanceof PdfLimitError) {
        return jsonError(error.message, 422);
      }

      return jsonError(
        "We couldn't read this PDF. It may be damaged, encrypted, or image-based. Please try another PDF or paste the resume text manually.",
        422
      );
    }

    const normalizedText = normalizeExtractedText(extractedText);

    if (normalizedText.length < MIN_TEXT_LENGTH) {
      return jsonError(
        "We couldn't find enough readable text in this PDF. This usually happens with scanned or image-based resumes. Please upload a text-based PDF or paste the resume text manually.",
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
        "File is too large. Please upload a PDF under 5 MB.",
        413
      );
    }

    console.error("PDF upload error:", error);

    return jsonError(
      "Something went wrong while processing your resume. Please try again.",
      500
    );
  }
}
