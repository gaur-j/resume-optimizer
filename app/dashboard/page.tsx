"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { CreditsCard } from "@/components/dashboard/CreditsCard";
import { BuyCreditsModal } from "@/components/dashboard/BuyCreditsModal";
import { ResultsPanelSkeleton } from "@/components/dashboard/DashboardSkeletons";
import { ResultsPanel } from "@/components/dashboard/ResultsPanel";
import { ResumeUploader } from "@/components/dashboard/ResumeUploader";
import type {
  ATSAnalysis,
  BulletRewrite,
  TailoredResume,
} from "@/types/analysis";
import { Textarea } from "@/components/ui/textarea";

interface AnalysisResults {
  scan_id: string;
  ats_analysis: ATSAnalysis;
  bullet_rewrites: BulletRewrite[];
  tailored_resume: TailoredResume;
}

export default function DashboardPage() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);

  // Separated analysis state
  const [analysis, setAnalysis] = useState<ATSAnalysis | null>(null);
  const [bulletRewrites, setBulletRewrites] = useState<BulletRewrite[]>([]);
  const [tailoredResume, setTailoredResume] = useState<TailoredResume | null>(
    null
  );
  // acceptedResume is an editable working copy derived from tailoredResume.
  // Accepting suggestions updates acceptedResume without mutating tailoredResume.
  const [acceptedResume, setAcceptedResume] = useState<TailoredResume | null>(
    null
  );

  const [error, setError] = useState("");

  const [credits, setCredits] = useState<number | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [showBuyModal, setShowBuyModal] = useState(false);

  const supabase = createClient();
  const resultsRef = useRef<HTMLDivElement>(null);

  const fetchCredits = useCallback(async () => {
    setCreditsLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setCreditsLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("users")
      .select("scan_credits")
      .eq("id", user.id)
      .single();

    if (fetchError) {
      console.error("Failed to fetch credits:", fetchError);
    }

    setCredits(data?.scan_credits ?? 0);
    setCreditsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();

    if (!resumeText.trim() || !jobDescription.trim()) {
      setError("Please add your resume and the job description first");
      return;
    }

    if (credits !== null && credits <= 0) {
      setShowBuyModal(true);
      return;
    }

    setLoading(true);
    setError("");
    // Clear previous analysis and tailored resumes
    setAnalysis(null);
    setBulletRewrites([]);
    setTailoredResume(null);
    setAcceptedResume(null);

    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
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

        setError(data.error || "Analysis failed");
        return;
      }

      const { ats_analysis, bullet_rewrites, tailored_resume } = data.data;
      setAnalysis(ats_analysis);
      setBulletRewrites(bullet_rewrites || []);
      setTailoredResume(tailored_resume ?? null);
      // create a deep copy for acceptedResume so user accepts don't mutate original tailoredResume
      setAcceptedResume(tailored_resume ? JSON.parse(JSON.stringify(tailored_resume)) : null);
      fetchCredits();
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            ATS Resume Analysis
          </div>

          <h1 className="mt-5 font-mono text-4xl font-semibold tracking-tight text-foreground">
            Analyze Your Resume
          </h1>

          <p className="mt-3 max-w-2xl text-muted-foreground">
            Upload your resume and match it with a job description to find ATS
            score, missing keywords, and AI-powered improvements.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* Main */}
          <div className="space-y-8 lg:col-span-2">
            <div className="rounded-2xl border border-border bg-card p-8 shadow-xl">
              <form onSubmit={handleAnalyze} className="space-y-8">
                <div>
                  <label className="mb-3 block font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    Your Resume
                  </label>

                  <ResumeUploader
                    onExtracted={(text) => setResumeText(text)}
                    disabled={loading}
                  />
                </div>

                <div className="border-t border-border pt-8">
                  <label
                    htmlFor="job-description"
                    className="mb-3 block font-mono text-xs uppercase tracking-widest text-muted-foreground"
                  >
                    Job Description
                  </label>

                  <Textarea
                    id="job-description"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here..."
                    className="min-h-[220px] rounded-xl border-border font-sans bg-background px-4 py-3 focus-visible:ring-primary"
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || creditsLoading}
                  className="h-12 w-full bg-primary hover:bg-primary/90 font-sans shadow-sm"
                >
                  {loading ? "Analyzing..." : "Get ATS Score →"}
                </Button>
              </form>
            </div>

            <div ref={resultsRef}>
              {loading && (
                <div className="motion-safe:animate-in motion-safe:fade-in rounded-2xl border border-border bg-card p-8 shadow-xl">
                  <h2 className="mb-6 font-mono text-2xl font-semibold text-foreground">
                    Analysis Results
                  </h2>

                  <ResultsPanelSkeleton />
                </div>
              )}

              {analysis && tailoredResume && !loading && (
                <div className="motion-safe:animate-in motion-safe:fade-in rounded-2xl border border-border bg-card p-8 shadow-xl">
                  <ResultsPanel
                                  atsAnalysis={analysis}
                                  bulletRewrites={bulletRewrites}
                                  tailoredResume={tailoredResume}
                                  acceptedResume={acceptedResume}
                                  onAcceptSuggestion={(bulletIndex: number, selected: string) => {
                                    if (!tailoredResume || !acceptedResume) return;

                                    // Work on a deep copy so we never mutate the original tailoredResume
                                    const newAccepted = JSON.parse(JSON.stringify(acceptedResume));

                                    // Update summary counter if present
                                    if (newAccepted.changes_summary) {
                                      newAccepted.changes_summary.bullets_rewritten =
                                        (newAccepted.changes_summary.bullets_rewritten || 0) + 1;
                                    }

                                    // Find the original text from the bulletRewrites list and replace first occurrence
                                    const original = bulletRewrites[bulletIndex]?.original;
                                    if (original) {
                                      const idx = newAccepted.full_text.indexOf(original);
                                      if (idx !== -1) {
                                        newAccepted.full_text =
                                          newAccepted.full_text.slice(0, idx) +
                                          selected +
                                          newAccepted.full_text.slice(idx + original.length);
                                      } else {
                                        // fallback: append the selected rewrite at the end
                                        newAccepted.full_text = newAccepted.full_text + "\n" + selected;
                                      }
                                    }

                                    setAcceptedResume(newAccepted);
                                  }}
                                />
                              </div>
                            )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-1">
            <CreditsCard
              credits={credits}
              loading={creditsLoading}
              onBuyMore={() => setShowBuyModal(true)}
            />

            <div className="rounded-2xl border border-border bg-secondary p-6 shadow-xl">
              <h3 className="mb-4 font-mono text-lg font-semibold text-foreground">
                💡 Quick Tips
              </h3>

              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>✓ Match keywords from the job description.</li>
                <li>✓ Add measurable achievements.</li>
                <li>✓ Use action verbs like Built, Led, Designed.</li>
                <li>✓ Keep formatting ATS-friendly.</li>
                <li>✓ Tailor every resume to the job.</li>
              </ul>
            </div>
          </div>
        </div>

        {showBuyModal && (
          <BuyCreditsModal
            onClose={() => setShowBuyModal(false)}
            onSuccess={() => {
              setShowBuyModal(false);
              fetchCredits();
            }}
          />
        )}
      </div>
    </div>
  );
}
