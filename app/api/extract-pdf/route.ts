import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { handlePdfUpload, jsonError } from "@/lib/pdf-upload";

export const runtime = "nodejs";

const SERVER_ERROR =
  "Something went wrong while processing your resume. Please try again.";

export async function POST(request: NextRequest) {
  // Gate: only signed-in users. Everything else (size/type checks, parser
  // limits, text extraction) is shared with the public route.

  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }
  } catch (error) {
    console.error("PDF upload error:", error);
    return jsonError(SERVER_ERROR, 500);
  }
  return handlePdfUpload(request, {
    minTextLength: 20,
    extractionLogLabel: "PDF extraction error:",
    uploadLogLabel: "PDF upload error:",
    messages: {
      noFile: "No file was uploaded.",
      tooLarge: "File is too large. Please upload a PDF under 5 MB.",
      notPdf:
        "This file doesn't appear to be a valid PDF. Please upload the original PDF resume.",
      unreadable:
        "We couldn't read this PDF. It may be damaged, encrypted, or image-based. Please try another PDF or paste the resume text manually.",
      tooLittleText:
        "We couldn't find enough readable text in this PDF. This usually happens with scanned or image-based resumes. Please upload a text-based PDF or paste the resume text manually.",
      serverError: SERVER_ERROR,
    },
  });
}
