"use client";

import { useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ResumeUploader } from "@/components/dashboard/ResumeUploader";
import { AuthCTAButton } from "@/components/auth/AuthTriggers";
import { trackEvent } from "@/lib/analytics";

type PreviewResult = {
  overall_score: number;
  sections: {
    keywords: number;
    experience: number;
    formatting: number;
    skills: number;
  };
  matched_keyword_count: number;
  missing_keyword_count: number;
};

function getScoreLabel(score: number) {
  if (score >= 80) return "Strong ATS match";
  if (score >= 65) return "Decent match — room to improve";
  if (score >= 50) return "Needs improvement";
  return "High rejection risk";
}

export function ATSPreview() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<PreviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canScan =
    resumeText.trim().length >= 50 &&
    jobDescription.trim().length >= 50 &&
    !loading;

  async function handlePreview() {
    if (!canScan) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/preview-score", {
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
        throw new Error(data.error ?? "We couldn't calculate your ATS score.");
      }

      setResult(data.data);
      trackEvent("preview_score_viewed", {
        score: data.data.overall_score,
        matched_keywords: data.data.matched_keyword_count,
        missing_keywords: data.data.missing_keyword_count,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      id="free-ats-check"
      className="border-y border-border bg-secondary/40 py-12 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Free ATS preview
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
            See your ATS score before creating an account
          </h2>

          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
            Upload your resume, paste the job description, and get your score
            first. No signup wall.
          </p>
        </div>

        {!result ? (
          <div className="mx-auto max-w-4xl rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-6 lg:p-8">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <label className="mb-3 block text-sm font-semibold text-foreground">
                  Your resume
                </label>

                <ResumeUploader
                  endpoint="/api/public-extract-pdf"
                  onExtracted={(text) => {
                    setResumeText(text);
                    setError("");
                  }}
                  disabled={loading}
                />
              </div>

              <div>
                <label
                  htmlFor="preview-job-description"
                  className="mb-3 block text-sm font-semibold text-foreground"
                >
                  Target job description
                </label>

                <Textarea
                  id="preview-job-description"
                  value={jobDescription}
                  onChange={(event) => {
                    setJobDescription(event.target.value);

                    if (error) {
                      setError("");
                    }
                  }}
                  placeholder="Paste the complete job description here..."
                  disabled={loading}
                  className="min-h-[250px] resize-y rounded-2xl"
                />

                <p className="mt-2 text-xs text-muted-foreground">
                  The more complete the job description, the more useful your
                  score will be.
                </p>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-6 flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/5 p-4"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="mt-6 border-t border-border pt-6">
              <Button
                type="button"
                size="lg"
                onClick={() => void handlePreview()}
                disabled={!canScan}
                className="h-12 w-full rounded-xl text-sm font-semibold sm:text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calculating your ATS score...
                  </>
                ) : (
                  <>
                    See my ATS score
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                Free preview · No card required · No account required
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="text-center">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Your ATS score
              </p>

              <div className="mt-3 text-6xl font-bold tracking-tight text-foreground sm:text-7xl">
                {result.overall_score}
                <span className="text-2xl text-muted-foreground">/100</span>
              </div>

              <p className="mt-2 text-sm font-medium text-primary sm:text-base">
                {getScoreLabel(result.overall_score)}
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Keywords", result.sections.keywords],
                ["Experience", result.sections.experience],
                ["Formatting", result.sections.formatting],
                ["Skills", result.sections.skills],
              ].map(([label, score]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-border bg-secondary/40 p-4 text-center"
                >
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">
                    {score}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-success/10 p-4">
                <p className="text-xs text-muted-foreground">
                  Matched keywords
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {result.matched_keyword_count}
                </p>
              </div>

              <div className="rounded-2xl bg-warning/10 p-4">
                <p className="text-xs text-muted-foreground">
                  Missing keywords
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {result.missing_keyword_count}
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
              <h3 className="text-base font-semibold text-foreground">
                Want the full report?
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Create your free account to see the detailed keyword gaps,
                bullet rewrites, tailored resume, and downloadable PDF.
              </p>

              <div className="mt-4">
                <AuthCTAButton
                  mode="signup"
                  className="w-full sm:w-auto"
                  onClick={() =>
                    trackEvent("preview_to_signup_click", {
                      score: result.overall_score,
                    })
                  }
                >
                  Unlock my full analysis →
                </AuthCTAButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
