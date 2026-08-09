import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { analyzeATS, rewriteBullets, tailorResume } from "@/lib/ai";
import { extractBullets } from "@/lib/utils";
import { getSuggestionLimit, isPaidUser } from "@/lib/plan";
import { checkRateLimits, ANALYZE_RATE_LIMITS } from "@/lib/rate-limit";

interface ConsumeCreditResult {
  success: boolean;
  remaining_credits: number;
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    // Check authentication
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

    // --- RATE LIMITING ---
    const rateLimitFailure = await checkRateLimits(
      supabase,
      user.id,
      ANALYZE_RATE_LIMITS
    );

    if (rateLimitFailure) {
      return NextResponse.json(
        {
          error:
            "You're doing that too often. Please slow down and try again shortly.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimitFailure.retryAfterSeconds),
          },
        }
      );
    }

    // --- ATOMIC CREDIT CONSUME ---
    const { data: creditResult, error: creditError } = await supabase
      .rpc("consume_scan_credit", { p_user_id: user.id })
      .single<ConsumeCreditResult>();

    if (creditError) {
      console.error("Credit consume RPC failed:", creditError);
      return NextResponse.json(
        { error: "Failed to check credits. Please try again." },
        { status: 500 }
      );
    }

    if (!creditResult?.success) {
      return NextResponse.json(
        { error: "Insufficient credits. Please purchase more scans." },
        { status: 402 }
      );
    }

    const remainingCredits = creditResult.remaining_credits;

    const { data: userData } = await supabase
      .from("users")
      .select("total_paid_scans")
      .eq("id", user.id)
      .single();

    const totalPaid = userData?.total_paid_scans || 0;
    const suggestionLimit = getSuggestionLimit(totalPaid);

    try {
      // --- PARALLELIZED: steps 1 and 2 don't depend on each other ---
      // analyzeATS() scores the resume against the JD. rewriteBullets()
      // only needs the extracted bullets + JD text — it never reads
      // atsAnalysis. Running them concurrently removes one full AI
      // round-trip from the user's wait time. tailorResume() genuinely
      // depends on atsAnalysis's keyword lists, so it still runs after.
      const bullets = extractBullets(resume_text);

      const [atsAnalysis, allBulletRewrites] = await Promise.all([
        analyzeATS(resume_text, jd_text),
        bullets.length > 0
          ? rewriteBullets(bullets, jd_text)
          : Promise.resolve([]),
      ]);

      // 3. Generate Tailored Resume (LOOPHOLE CLOSED)
      // By passing an empty array `[]` for bulletRewrites, the AI will
      // ONLY do basic keyword insertion on the tailored resume. The
      // premium rewrites are forced to stay inside the "Suggested
      // Changes" panel!
      const tailoredResume = await tailorResume(resume_text, jd_text, {
        matchedKeywords: atsAnalysis.matched_keywords,
        missingKeywords: atsAnalysis.missing_keywords,
        bulletRewrites: [],
      });

      // 4. Save the FULL result to the database
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
        throw new Error("Failed to save analysis");
      }

      // 5. Slice the rewrites according to their exact tier limit
      const visibleBulletRewrites = allBulletRewrites.slice(0, suggestionLimit);

      return NextResponse.json({
        success: true,
        data: {
          scan_id: scanData.id,
          ats_analysis: atsAnalysis,
          bullet_rewrites: visibleBulletRewrites,
          total_suggestions_available: allBulletRewrites.length,
          is_paid_user: isPaidUser(totalPaid),
          suggestion_limit: suggestionLimit,
          tailored_resume: tailoredResume,
          remaining_credits: remainingCredits,
        },
      });
    } catch (pipelineError) {
      const { error: refundError } = await supabase
        .rpc("refund_scan_credit", { p_user_id: user.id })
        .single();

      if (refundError) {
        console.error(
          "CRITICAL: failed to refund credit after pipeline error:",
          refundError,
          "user:",
          user.id
        );
      }

      throw pipelineError;
    }
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
