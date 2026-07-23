"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { CreditsCard } from "@/components/dashboard/CreditsCard";
import { BuyCreditsModal } from "@/components/dashboard/BuyCreditsModal";
import { ResultsPanelSkeleton } from "@/components/dashboard/DashboardSkeletons";
import { ResultsPanel } from "@/components/dashboard/ResultsPanel";
import { ResumeUploader } from "@/components/dashboard/ResumeUploader";
import type { ATSAnalysis, BulletRewrite } from "@/types/analysis";
import { Textarea } from "@/components/ui/textarea";

interface AnalysisResults {
  scan_id: string;
  ats_analysis: ATSAnalysis;
  bullet_rewrites: BulletRewrite[];
}

export default function DashboardPage() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResults | null>(null);
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
    setResults(null);

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

      setResults(data.data);
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

              {results && !loading && (
                <div className="motion-safe:animate-in motion-safe:fade-in rounded-2xl border border-border bg-card p-8 shadow-xl">
                  <ResultsPanel
                    atsAnalysis={results.ats_analysis}
                    bulletRewrites={results.bullet_rewrites}
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
