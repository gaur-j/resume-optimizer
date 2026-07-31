import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { analyzeATS, rewriteBullets, tailorResume } from "@/lib/ai";
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

    // Check user's scan credits — also pull total_paid_scans now, since that's
    // what decides how many suggestions this user is allowed to see.
    const { data: userData } = await supabase
      .from("users")
      .select("scan_credits, total_paid_scans")
      .eq("id", user.id)
      .single();

    if (!userData || userData.scan_credits <= 0) {
      return NextResponse.json(
        { error: "Insufficient credits. Please purchase more scans." },
        { status: 402 }
      );
    }

    // --- TIER LIMIT LOGIC ---
    // Calculate how many suggestions to show based on purchase history
    const totalPaid = userData.total_paid_scans || 0;
    let suggestionLimit = 3; // Default Free Tier

    if (totalPaid >= 5) {
      suggestionLimit = 8; // Pack Plan (₹249) - Gets 8 suggestions
    } else if (totalPaid > 0) {
      suggestionLimit = 5; // Single Plan (₹99) - Gets 5 suggestions
    }
    // 1. Analyze ATS
    const atsAnalysis = await analyzeATS(resume_text, jd_text);

    // 2. Generate ALL Premium Bullet Rewrites
    const bullets = extractBullets(resume_text);
    const allBulletRewrites =
      bullets.length > 0 ? await rewriteBullets(bullets, jd_text) : [];

    // 3. Generate Tailored Resume (LOOPHOLE CLOSED)
    // By passing an empty array `[]` for bulletRewrites, the AI will ONLY do
    // basic keyword insertion on the tailored resume. The premium rewrites
    // are forced to stay inside the "Suggested Changes" panel!
    const tailoredResume = await tailorResume(resume_text, jd_text, {
      matchedKeywords: atsAnalysis.matched_keywords,
      missingKeywords: atsAnalysis.missing_keywords,
      bulletRewrites: [],
    });

    // Save the FULL result to the database — nothing is lost. Truncation
    // only happens on the response below. This means if this user upgrades
    // later, a future "view past scan" feature could show the complete
    // result retroactively without re-running the AI pipeline.
    // 4. Save the FULL result to the database in case they upgrade later
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
          bullet_rewrites: allBulletRewrites,
          tailored_resume: tailoredResume,
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

    // Enforce the free-tier suggestion limit HERE, server-side — this is
    // what makes it a real limit
    // 5. Slice the rewrites according to their exact tier limit

    const visibleBulletRewrites = allBulletRewrites.slice(0, suggestionLimit);

    return NextResponse.json({
      success: true,
      data: {
        scan_id: scanData.id,
        ats_analysis: atsAnalysis,
        bullet_rewrites: visibleBulletRewrites,
        total_suggestions_available: allBulletRewrites.length,
        is_paid_user: totalPaid > 0,
        suggestion_limit: suggestionLimit, // Pass this to the frontend
        tailored_resume: tailoredResume,
        remaining_credits: remainingCredits,
      },
    });
  } catch (error) {
    console.error("Analysis error:", error);

    if (error instanceof Error && error.message.includes("API")) {
      return NextResponse.json(
        { error: "AI service error. Please try again." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
