import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { analyzeATS, rewriteBullets } from "@/lib/ai";
import { extractBullets } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const { resume_text, jd_text } = await request.json();

    if (!resume_text?.trim() || !jd_text?.trim()) {
      return NextResponse.json(
        { error: "Resume and job description are required" },
        { status: 400 }
      );
    }

    // Check user's scan credits
    const { data: userData } = await supabase
      .from("users")
      .select("scan_credits")
      .eq("id", user.id)
      .single();

    if (!userData || userData.scan_credits <= 0) {
      return NextResponse.json(
        { error: "Insufficient credits. Please purchase more scans." },
        { status: 402 }
      );
    }

    // Call Claude API for ATS analysis
    const atsAnalysis = await analyzeATS(resume_text, jd_text);

    // Extract bullets and rewrite them
    const bullets = extractBullets(resume_text);
    const bulletRewrites =
      bullets.length > 0 ? await rewriteBullets(bullets, jd_text) : [];

    // Save scan to database
    const { data: scanData, error: scanError } = await supabase
      .from("scans")
      .insert({
        user_id: user.id,
        resume_text,
        jd_text,
        is_paid: false,
        ats_score: atsAnalysis.overall_score,
        result_json: {
          ats_analysis: atsAnalysis,
          bullet_rewrites: bulletRewrites,
        },
      })
      .select()
      .single();

    if (scanError) {
      console.error("Error saving scan:", scanError);
      return NextResponse.json(
        { error: "Failed to save analysis" },
        { status: 500 }
      );
    }

    // Decrement user's scan credits
    const remainingCredits = userData.scan_credits - 1;

    await supabase
      .from("users")
      .update({
        scan_credits: remainingCredits,
      })
      .eq("id", user.id);

    return NextResponse.json({
      success: true,
      data: {
        scan_id: scanData.id,
        ats_analysis: atsAnalysis,
        bullet_rewrites: bulletRewrites,
        remaining_credits: remainingCredits,
      },
    });
  } catch (error) {
    console.error("Analysis error:", error);

    if (error instanceof Error && error.message.includes("API")) {
      return NextResponse.json(
        { error: "Claude API error. Please try again." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
