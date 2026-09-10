import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { exportResume } from "@/lib/export-resume";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const acceptedResume = body?.acceptedResume;

    if (!acceptedResume) {
      return NextResponse.json(
        { error: "Resume data is required." },
        { status: 400 }
      );
    }

    const result = await exportResume(acceptedResume);

    if (!result) {
      return NextResponse.json(
        { error: "Failed to generate your resume PDF." },
        { status: 500 }
      );
    }

    const headers = new Headers();

    headers.set("Content-Type", result.mime);

    headers.set(
      "Content-Disposition",
      `attachment; filename="${result.filename}"`
    );

    headers.set("Cache-Control", "private, no-store");

    const responseBody = result.buffer.buffer.slice(
      result.buffer.byteOffset,
      result.buffer.byteOffset + result.buffer.byteLength
    ) as ArrayBuffer;

    return new Response(responseBody, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("PDF export error:", error);

    return NextResponse.json(
      {
        error: "Unable to generate your resume PDF. Please try again.",
      },
      { status: 500 }
    );
  }
}
