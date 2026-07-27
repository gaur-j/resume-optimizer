import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { exportResume } from "@/lib/export-resume";

export async function POST(request: NextRequest) {
  try {
    // Every other route in this app (analyze, extract-pdf, create-order,
    // verify-payment) requires a logged-in user first. This route was
    // the one exception — meaning anyone who found the endpoint could
    // generate unlimited PDF/DOCX files for free, with no rate limit,
    // whether or not they'd ever paid for or even run an analysis.
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { acceptedResume, format, filename } = body;

    if (!acceptedResume) {
      return NextResponse.json(
        { error: "acceptedResume is required" },
        { status: 400 }
      );
    }

    const result = await exportResume(acceptedResume, format || "pdf");
    if (!result) {
      return NextResponse.json(
        { error: "Failed to generate export" },
        { status: 500 }
      );
    }

    const headers = new Headers();
    headers.set("Content-Type", result.mime);

    const fileName = filename || result.filename;
    headers.set("Content-Disposition", `attachment; filename="${fileName}"`);

    const responseBody = result.buffer.buffer.slice(
      result.buffer.byteOffset,
      result.buffer.byteOffset + result.buffer.byteLength
    ) as ArrayBuffer;

    return new Response(responseBody, {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
