import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { extractTextFromPDF } from "@/lib/pdf";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB — comfortably covers real resumes

export async function POST(request: NextRequest) {
  try {
    // Require login — same as the other API routes, to prevent
    // unauthenticated abuse of PDF parsing compute.
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file was uploaded" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Please upload a PDF file" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File is too large. Please upload a PDF under 5MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText: string;
    try {
      extractedText = await extractTextFromPDF(buffer);
    } catch (err) {
      console.error("PDF extraction error:", err);
      return NextResponse.json(
        {
          error:
            "Couldn't read that PDF. It may be a scanned image rather than text — try pasting the content manually instead.",
        },
        { status: 422 }
      );
    }

    if (!extractedText || extractedText.trim().length < 20) {
      return NextResponse.json(
        {
          error:
            "We couldn't find readable text in that PDF. This usually happens with scanned or image-based resumes — try pasting the text manually instead.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { text: extractedText },
    });
  } catch (error) {
    console.error("PDF upload error:", error);
    return NextResponse.json(
      { error: "Something went wrong reading that file. Please try again." },
      { status: 500 }
    );
  }
}
