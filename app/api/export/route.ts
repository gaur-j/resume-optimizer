import { NextRequest, NextResponse } from "next/server";
import { exportResume } from "@/lib/export-resume";

export async function POST(request: NextRequest) {
  try {
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

    return new Response(result.buffer, { status: 200, headers });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
