import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { exportResume } from "@/lib/export-resume";
import { getTemplate } from "@/lib/resume-templates/registry";
import { isSubscriber } from "@/lib/plan";

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
    const templateId =
      typeof body?.templateId === "string" ? body.templateId : undefined;

    if (!acceptedResume) {
      return NextResponse.json(
        { error: "Resume data is required." },
        { status: 400 }
      );
    }

    // Server-side enforcement, independent of whatever the picker UI
    // shows - a request can't unlock a paid template just by naming it in
    // the body. Subscription state lives on the users ROW (not on the
    // Supabase auth user), so it's read from there. If the column doesn't
    // exist yet (billing migration not run) the query errors, row is null,
    // and everyone is treated as a non-subscriber - fails closed.
    const template = getTemplate(templateId);
    if (template.tier === "paid") {
      const { data: row } = await supabase
        .from("users")
        .select("subscription_status")
        .eq("id", user.id)
        .single();

      if (!isSubscriber(row)) {
        return NextResponse.json(
          {
            error: `The "${template.name}" template requires a subscription.`,
            code: "TEMPLATE_LOCKED",
          },
          { status: 403 }
        );
      }
    }

    const result = await exportResume(acceptedResume, template.id);

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
