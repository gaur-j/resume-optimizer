"use client";

import { useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Clipboard,
  Copy,
  FileText,
  Lightbulb,
  Target,
  TriangleAlert,
} from "lucide-react";

import type {
  ATSAnalysis,
  BulletRewrite,
  TailoredResume,
} from "@/types/analysis";

import ExportResumeButton from "./ExportResumeButton";
import SuggestedChanges from "./SuggestedChanges";

interface ResultsPanelProps {
  atsAnalysis: ATSAnalysis;
  bulletRewrites: BulletRewrite[];
  tailoredResume: TailoredResume;
  acceptedResume?: TailoredResume | null;
  onAcceptSuggestion?: (bulletIndex: number, selected: string) => void;
  totalSuggestionsAvailable?: number;
  suggestionLimit: number;
  onUpgradeClick?: () => void;
}

function scoreColor(score: number) {
  if (score < 40) return "text-correction";
  if (score < 70) return "text-warning";
  return "text-approved";
}

function scoreRing(score: number) {
  if (score < 40) return "var(--correction)";
  if (score < 70) return "var(--warning)";
  return "var(--approved)";
}

function scoreLabel(score: number) {
  if (score < 40) return "Needs significant improvement";
  if (score < 70) return "Good foundation";
  if (score < 85) return "Strong match";
  return "Excellent match";
}

function scoreDescription(score: number) {
  if (score < 40) {
    return "Your resume has several alignment gaps. Start with the critical issues below.";
  }

  if (score < 70) {
    return "Your resume has a solid foundation, but there are meaningful opportunities to improve the match.";
  }

  if (score < 85) {
    return "Your resume aligns well with the role. The recommendations below can strengthen the remaining gaps.";
  }

  return "Your resume is highly aligned with this job. Review the recommendations for final improvements.";
}

export function ResultsPanel({
  atsAnalysis,
  bulletRewrites,
  tailoredResume,
  acceptedResume,
  onAcceptSuggestion,
  totalSuggestionsAvailable,
  suggestionLimit,
  onUpgradeClick,
}: ResultsPanelProps) {
  const [copiedResume, setCopiedResume] = useState(false);

  const activeResume = acceptedResume ?? tailoredResume;

  const circumference = 2 * Math.PI * 45;
  const score = Math.max(0, Math.min(100, atsAnalysis.overall_score));
  const offset = circumference - (score / 100) * circumference;

  const criticalCount = atsAnalysis.critical_issues.length;
  const quickWinCount = atsAnalysis.quick_wins.length;
  const missingKeywordCount = atsAnalysis.missing_keywords.length;

  const improvementSummary = useMemo(() => {
    const total = criticalCount + missingKeywordCount + quickWinCount;

    if (total === 0) {
      return "Your resume is already well aligned with this role.";
    }

    if (criticalCount > 0) {
      return `Start with ${criticalCount} critical issue${
        criticalCount > 1 ? "s" : ""
      } before making final edits.`;
    }

    if (missingKeywordCount > 0) {
      return `The biggest remaining opportunity is closing ${missingKeywordCount} keyword gap${
        missingKeywordCount > 1 ? "s" : ""
      }.`;
    }

    return `${quickWinCount} quick improvement${
      quickWinCount > 1 ? "s" : ""
    } can strengthen your application.`;
  }, [criticalCount, missingKeywordCount, quickWinCount]);

  async function copyTailoredResume() {
    try {
      await navigator.clipboard.writeText(activeResume.full_text);
      setCopiedResume(true);

      window.setTimeout(() => {
        setCopiedResume(false);
      }, 1800);
    } catch (error) {
      console.error("Failed to copy tailored resume:", error);
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* =========================================================
SCORE OVERVIEW
========================================================= */}{" "}
      <section className="overflow-hidden rounded-2xl border border-border bg-card sm:rounded-3xl">
        {" "}
        <div className="p-5 sm:p-6 lg:p-8">
          {" "}
          <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
            {/* Score */}{" "}
            <div className="flex flex-col items-center text-center lg:border-r lg:border-border lg:pr-8">
              {" "}
              <div className="relative h-36 w-36">
                {" "}
                <svg
                  className="h-36 w-36 -rotate-90"
                  viewBox="0 0 100 100"
                  aria-hidden="true"
                >
                  {" "}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={scoreRing(score)}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-bold ${scoreColor(score)}`}>
                    {score}
                  </span>

                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    / 100
                  </span>
                </div>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-foreground">
                ATS match score
              </h2>
              <p className={`mt-1 text-sm font-medium ${scoreColor(score)}`}>
                {scoreLabel(score)}
              </p>
            </div>
            {/* Interpretation */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" aria-hidden="true" />

                <h3 className="text-base font-semibold text-foreground sm:text-lg">
                  What your score means
                </h3>
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                {scoreDescription(score)}
              </p>

              <div className="mt-5 rounded-xl border border-primary/15 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />

                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Recommended next move
                    </p>

                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      {improvementSummary}
                    </p>
                  </div>
                </div>
              </div>

              {/* Score breakdown */}
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Object.entries(atsAnalysis.sections).map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-xl border border-border bg-background p-3"
                  >
                    <p className="truncate text-[11px] font-medium capitalize text-muted-foreground">
                      {key}
                    </p>

                    <p
                      className={`mt-1 text-xl font-semibold ${scoreColor(
                        value
                      )}`}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* =========================================================
      KEYWORD MATCH
      ========================================================= */}
      <section className="rounded-2xl border border-border bg-card p-5 sm:rounded-3xl sm:p-6 lg:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              Keyword match
            </h2>

            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              See which job-relevant terms are already covered and which still
              need attention.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-approved">
              {atsAnalysis.matched_keywords.length} matched
            </span>
            <span>·</span>
            <span className="font-medium text-correction">
              {missingKeywordCount} missing
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2
                className="h-4 w-4 text-approved"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold text-foreground">
                Matched keywords
              </h3>
            </div>

            {atsAnalysis.matched_keywords.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {atsAnalysis.matched_keywords.map((keyword, index) => (
                  <span
                    key={`${keyword}-${index}`}
                    className="rounded-full border border-approved/25 bg-approved/10 px-2.5 py-1 text-xs font-medium text-approved"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No strong keyword matches were detected.
              </p>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <TriangleAlert
                className="h-4 w-4 text-correction"
                aria-hidden="true"
              />

              <h3 className="text-sm font-semibold text-foreground">
                Missing keywords
              </h3>
            </div>

            {missingKeywordCount > 0 ? (
              <div className="flex flex-wrap gap-2">
                {atsAnalysis.missing_keywords.map((keyword, index) => (
                  <span
                    key={`${keyword}-${index}`}
                    className="rounded-full border border-correction/25 bg-correction/10 px-2.5 py-1 text-xs font-medium text-correction"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-approved">
                No significant keyword gaps detected.
              </p>
            )}
          </div>
        </div>
      </section>
      {/* =========================================================
      ACTION ITEMS
      ========================================================= */}
      {(criticalCount > 0 || quickWinCount > 0) && (
        <section className="rounded-2xl border border-border bg-card p-5 sm:rounded-3xl sm:p-6 lg:p-8">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              Action plan
            </h2>

            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Focus on the highest-value improvements first.
            </p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {criticalCount > 0 && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <TriangleAlert
                    className="h-4 w-4 text-destructive"
                    aria-hidden="true"
                  />

                  <h3 className="text-sm font-semibold text-foreground">
                    Critical issues
                  </h3>
                </div>

                <ul className="mt-4 space-y-3">
                  {atsAnalysis.critical_issues.map((issue, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2.5 text-sm leading-6 text-foreground"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {quickWinCount > 0 && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <Lightbulb
                    className="h-4 w-4 text-primary"
                    aria-hidden="true"
                  />

                  <h3 className="text-sm font-semibold text-foreground">
                    Quick wins
                  </h3>
                </div>

                <ul className="mt-4 space-y-3">
                  {atsAnalysis.quick_wins.map((win, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2.5 text-sm leading-6 text-foreground"
                    >
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{win}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}
      {/* =========================================================
      SUGGESTED CHANGES
      ========================================================= */}
      {(bulletRewrites.length > 0 ||
        (totalSuggestionsAvailable ?? 0) > bulletRewrites.length) && (
        <section className="rounded-2xl border border-border bg-card p-5 sm:rounded-3xl sm:p-6 lg:p-8">
          <SuggestedChanges
            bulletRewrites={bulletRewrites}
            totalSuggestionsAvailable={totalSuggestionsAvailable}
            suggestionLimit={suggestionLimit}
            onUpgradeClick={onUpgradeClick}
            onAccept={(index, selected) =>
              onAcceptSuggestion?.(index, selected)
            }
          />
        </section>
      )}
      {/* =========================================================
      TAILORED RESUME
      ========================================================= */}
      <section className="rounded-2xl border border-border bg-card p-5 sm:rounded-3xl sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" aria-hidden="true" />

              <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                Your tailored resume
              </h2>
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-5 text-muted-foreground">
              {acceptedResume
                ? "This version includes the suggestions you accepted."
                : "This version includes ATS-focused keyword improvements while preserving your original experience."}
            </p>
          </div>

          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            <ExportResumeButton
              acceptedResume={activeResume}
              filename={undefined}
            />

            <button
              type="button"
              onClick={copyTailoredResume}
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={
                copiedResume ? "Tailored resume copied" : "Copy tailored resume"
              }
            >
              {copiedResume ? (
                <>
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {tailoredResume.keywords_added.length > 0 && (
          <div className="border-b border-border py-5">
            <div className="mb-3 flex items-center gap-2">
              <Clipboard className="h-4 w-4 text-primary" aria-hidden="true" />

              <h3 className="text-sm font-semibold text-foreground">
                Keywords added
              </h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {tailoredResume.keywords_added.map((keyword, index) => (
                <span
                  key={`${keyword}-${index}`}
                  className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="pt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Resume text
            </p>

            {acceptedResume && (
              <span className="text-xs text-approved">
                Accepted edits applied
              </span>
            )}
          </div>

          <pre className="max-h-[720px] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-border bg-background p-4 font-sans text-sm leading-6 text-foreground sm:p-5">
            {activeResume.full_text}
          </pre>
        </div>
      </section>
    </div>
  );
}
