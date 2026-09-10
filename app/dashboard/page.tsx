"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AlertCircle, CheckCircle2, FileSearch, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";

import { CreditsCard } from "@/components/dashboard/CreditsCard";
import { BuyCreditsModal } from "@/components/dashboard/BuyCreditsModal";
import { AnalysisProgress } from "@/components/dashboard/AnalysisProgress";
import { ResultsPanel } from "@/components/dashboard/ResultsPanel";
import { ResumeUploader } from "@/components/dashboard/ResumeUploader";

import type {
  ATSAnalysis,
  BulletRewrite,
  TailoredResume,
} from "@/types/analysis";

export default function DashboardPage() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [analysis, setAnalysis] = useState<ATSAnalysis | null>(null);
  const [bulletRewrites, setBulletRewrites] = useState<BulletRewrite[]>([]);
  const [tailoredResume, setTailoredResume] = useState<TailoredResume | null>(
    null
  );
  const [acceptedResume, setAcceptedResume] = useState<TailoredResume | null>(
    null
  );

  const [totalSuggestionsAvailable, setTotalSuggestionsAvailable] = useState<
    number | undefined
  >(undefined);
  const [suggestionLimit, setSuggestionLimit] = useState(3);

  const [credits, setCredits] = useState<number | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [showBuyModal, setShowBuyModal] = useState(false);

  const supabase = createClient();
  const resultsRef = useRef<HTMLDivElement>(null);

  const fetchCredits = useCallback(async () => {
    setCreditsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCredits(null);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("users")
        .select("scan_credits")
        .eq("id", user.id)
        .single();

      if (fetchError) {
        console.error("Failed to fetch credits:", fetchError);
        setCredits(0);
        return;
      }

      setCredits(data?.scan_credits ?? 0);
    } catch (err) {
      console.error("Failed to fetch credits:", err);
      setCredits(0);
    } finally {
      setCreditsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const hasResume = resumeText.trim().length > 0;
  const hasJobDescription = jobDescription.trim().length > 0;
  const canAnalyze = hasResume && hasJobDescription && !loading;

  async function handleAnalyze(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!hasResume || !hasJobDescription) {
      setError(
        "Add both your resume and the job description before starting the analysis."
      );
      return;
    }

    if (credits !== null && credits <= 0) {
      setShowBuyModal(true);
      return;
    }

    setLoading(true);
    setError("");

    setAnalysis(null);
    setBulletRewrites([]);
    setTailoredResume(null);
    setAcceptedResume(null);
    setTotalSuggestionsAvailable(undefined);

    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resume_text: resumeText,
          jd_text: jobDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          setShowBuyModal(true);
        }

        setError(data.error || "Analysis failed. Please try again.");
        return;
      }

      const {
        ats_analysis,
        bullet_rewrites,
        tailored_resume,
        total_suggestions_available,
        suggestion_limit,
      } = data.data;

      setAnalysis(ats_analysis);
      setBulletRewrites(bullet_rewrites || []);
      setTailoredResume(tailored_resume ?? null);
      setTotalSuggestionsAvailable(total_suggestions_available);
      setSuggestionLimit(suggestion_limit);

      setAcceptedResume(
        tailored_resume ? JSON.parse(JSON.stringify(tailored_resume)) : null
      );

      fetchCredits();
    } catch (err) {
      console.error("Analysis request failed:", err);
      setError(
        "Something went wrong while analyzing your resume. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleAcceptSuggestion(bulletIndex: number, selected: string) {
    if (!tailoredResume || !acceptedResume) return;

    const newAccepted = JSON.parse(
      JSON.stringify(acceptedResume)
    ) as TailoredResume;

    if (newAccepted.changes_summary) {
      newAccepted.changes_summary.bullets_rewritten =
        (newAccepted.changes_summary.bullets_rewritten || 0) + 1;
    }

    const original = bulletRewrites[bulletIndex]?.original;

    if (original) {
      const index = newAccepted.full_text.indexOf(original);

      if (index !== -1) {
        newAccepted.full_text =
          newAccepted.full_text.slice(0, index) +
          selected +
          newAccepted.full_text.slice(index + original.length);
      } else {
        newAccepted.full_text = `${newAccepted.full_text}\n${selected}`;
      }
    }

    setAcceptedResume(newAccepted);
  }

  return (
    <main className="min-h-screen bg-background">
      {/* =====================================================
          MOBILE / DESKTOP PAGE HEADER
          ===================================================== */}

      <section className="border-b border-border/70 bg-background">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                ATS Resume Analysis
              </div>

              <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                Optimize your resume for the job.
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                Upload your resume, paste the job description, and get an
                actionable ATS analysis with AI-powered improvements.
              </p>
            </div>

            {/* Desktop credits summary */}
            <div className="hidden w-full shrink-0 lg:block lg:w-72">
              <CreditsCard
                credits={credits}
                loading={creditsLoading}
                onBuyMore={() => setShowBuyModal(true)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          MAIN WORKSPACE
          ===================================================== */}

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {/* Mobile credits */}
        <div className="mb-6 lg:hidden">
          <CreditsCard
            credits={credits}
            loading={creditsLoading}
            onBuyMore={() => setShowBuyModal(true)}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          {/* =================================================
              PRIMARY WORKSPACE
              ================================================= */}

          <div className="min-w-0 space-y-6">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm sm:rounded-3xl">
              <form onSubmit={handleAnalyze} aria-busy={loading}>
                {/* Form header */}
                <div className="border-b border-border px-4 py-5 sm:px-6 sm:py-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <FileSearch className="h-4.5 w-4.5" aria-hidden="true" />
                    </div>

                    <div>
                      <h2 className="text-base font-semibold text-foreground sm:text-lg">
                        Start a new analysis
                      </h2>

                      <p className="mt-1 text-sm leading-5 text-muted-foreground">
                        Your resume and target job are analyzed together.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form body */}
                <div className="space-y-7 p-4 sm:p-6 lg:p-8">
                  {/* Resume */}
                  <div>
                    <div className="mb-3 flex items-end justify-between gap-4">
                      <div>
                        <label className="text-sm font-semibold text-foreground">
                          1. Your resume
                        </label>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Upload the latest version you want to improve.
                        </p>
                      </div>

                      <span className="hidden text-xs text-muted-foreground sm:block">
                        PDF · Max 5MB
                      </span>
                    </div>

                    <ResumeUploader
                      onExtracted={(text) => {
                        setResumeText(text);
                        setError("");
                      }}
                      disabled={loading}
                    />

                    {hasResume && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-success">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        Resume content is ready for analysis.
                      </div>
                    )}
                  </div>

                  {/* Divider / step indicator */}
                  <div className="flex items-center gap-3" aria-hidden="true">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Next
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  {/* Job description */}
                  <div>
                    <div className="mb-3 flex items-end justify-between gap-4">
                      <div>
                        <label
                          htmlFor="job-description"
                          className="text-sm font-semibold text-foreground"
                        >
                          2. Target job description
                        </label>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Paste the job posting you want to tailor your resume
                          for.
                        </p>
                      </div>

                      {hasJobDescription && (
                        <span className="shrink-0 text-xs text-success">
                          Added
                        </span>
                      )}
                    </div>

                    <Textarea
                      id="job-description"
                      value={jobDescription}
                      onChange={(e) => {
                        setJobDescription(e.target.value);

                        if (error) {
                          setError("");
                        }
                      }}
                      placeholder="Paste the complete job description here..."
                      disabled={loading}
                      aria-describedby="job-description-help"
                      className="min-h-[180px] resize-y rounded-xl border-border bg-background px-4 py-3 text-sm leading-6 sm:min-h-[220px] sm:text-base"
                    />

                    <div
                      id="job-description-help"
                      className="mt-2 flex justify-between gap-4 text-xs text-muted-foreground"
                    >
                      <span>
                        Include responsibilities, requirements, and skills.
                      </span>

                      <span className="shrink-0 tabular-nums">
                        {jobDescription.length.toLocaleString()} chars
                      </span>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div
                      role="alert"
                      aria-live="assertive"
                      className="flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/8 p-4 text-sm text-destructive"
                    >
                      <AlertCircle
                        className="mt-0.5 h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />

                      <div>
                        <p className="font-medium">
                          We couldn't start the analysis
                        </p>

                        <p className="mt-1 leading-5 opacity-90">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <div className="border-t border-border pt-6">
                    <Button
                      type="submit"
                      disabled={!canAnalyze || creditsLoading}
                      className="h-12 w-full rounded-xl text-sm font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:h-13 sm:text-base"
                    >
                      {loading ? (
                        <>
                          <span
                            className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                            aria-hidden="true"
                          />
                          Analyzing your resume...
                        </>
                      ) : creditsLoading ? (
                        "Checking available scans..."
                      ) : credits !== null && credits <= 0 ? (
                        "Get more scans"
                      ) : (
                        <>
                          Analyze my resume
                          <span className="ml-2" aria-hidden="true">
                            →
                          </span>
                        </>
                      )}
                    </Button>

                    {!hasResume || !hasJobDescription ? (
                      <p className="mt-3 text-center text-xs text-muted-foreground">
                        Add both inputs to unlock your ATS analysis.
                      </p>
                    ) : (
                      <p className="mt-3 text-center text-xs text-muted-foreground">
                        Your scan uses one available analysis credit.
                      </p>
                    )}
                  </div>
                </div>
              </form>
            </div>

            {/* =================================================
                ANALYSIS / RESULTS
                ================================================= */}

            <div ref={resultsRef} className="scroll-mt-24" aria-live="polite">
              {loading && <AnalysisProgress />}

              {analysis && tailoredResume && !loading && (
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm sm:rounded-3xl">
                  <div className="border-b border-border px-4 py-5 sm:px-6 sm:py-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/10 text-success">
                        <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                      </div>

                      <div>
                        <h2 className="text-base font-semibold text-foreground sm:text-lg">
                          Your analysis is ready
                        </h2>

                        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                          Review the recommendations below and accept the
                          changes you want to keep.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 lg:p-8">
                    <ResultsPanel
                      atsAnalysis={analysis}
                      bulletRewrites={bulletRewrites}
                      tailoredResume={tailoredResume}
                      acceptedResume={acceptedResume}
                      totalSuggestionsAvailable={totalSuggestionsAvailable}
                      suggestionLimit={suggestionLimit}
                      onUpgradeClick={() => setShowBuyModal(true)}
                      onAcceptSuggestion={handleAcceptSuggestion}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* =================================================
              CONTEXTUAL SIDEBAR
              ================================================= */}

          <aside className="space-y-4 lg:sticky lg:top-6">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-4">
                <p className="text-sm font-semibold text-foreground">
                  Before you analyze
                </p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  A few things that produce better results.
                </p>
              </div>

              <ul className="space-y-4">
                {[
                  "Use the resume version you actually send to employers.",
                  "Paste the complete job description, not just the requirements.",
                  "Keep measurable achievements whenever possible.",
                  "Review AI suggestions before accepting them.",
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                      <CheckCircle2
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                    </span>

                    <span className="text-sm leading-5 text-muted-foreground">
                      {tip}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    What you'll get
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    A structured breakdown of your resume's fit for the target
                    role.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  "ATS score",
                  "Keywords",
                  "Bullet rewrites",
                  "Tailored resume",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-xs font-medium text-muted-foreground"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* =====================================================
          PURCHASE MODAL
          ===================================================== */}

      {showBuyModal && (
        <BuyCreditsModal
          onClose={() => setShowBuyModal(false)}
          onSuccess={() => {
            setShowBuyModal(false);
            fetchCredits();
          }}
        />
      )}
    </main>
  );
}
