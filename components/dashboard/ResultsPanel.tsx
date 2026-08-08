"use client";

import { useState } from "react";
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
  // An editable working copy derived from tailoredResume that holds accepted edits
  acceptedResume?: TailoredResume | null;
  // Handler invoked when a user accepts a suggested rewrite; should update acceptedResume
  onAcceptSuggestion?: (bulletIndex: number, selected: string) => void;
  // Total suggestions the AI generated, which may exceed bulletRewrites.length
  // if the server truncated the array for a free-tier user.
  totalSuggestionsAvailable?: number;
  // Whether this user has ever purchased credits — unlocks every suggestion.
  suggestionLimit: number;
  // Opens the buy-credits modal from the "unlock all suggestions" teaser.
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
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedResume, setCopiedResume] = useState(false);

  function copyBullet(text: string, index: number) {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  }

  function copyTailoredResume() {
    const text = acceptedResume?.full_text ?? tailoredResume.full_text;
    navigator.clipboard.writeText(text);
    setCopiedResume(true);
    setTimeout(() => setCopiedResume(false), 1500);
  }

  const circumference = 2 * Math.PI * 45;
  const offset =
    circumference - (atsAnalysis.overall_score / 100) * circumference;

  return (
    <div className="sm:space-y-6 space-y-4">
      {/* Overall Score */}
      <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
        <h2
          className="text-lg sm:text-xl tracking-tight
         font-semibold text-foreground mb-4 font-mono"
        >
          ATS Score
        </h2>
        <div className="flex justify-center mb-4">
          <div className="relative w-32 h-32">
            <svg
              className="w-32 h-32 -rotate-90"
              viewBox="0 0 100 100"
              aria-hidden="true"
            >
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
                stroke={scoreRing(atsAnalysis.overall_score)}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className={`text-3xl font-bold ${scoreColor(
                  atsAnalysis.overall_score
                )}`}
              >
                {atsAnalysis.overall_score}
              </span>
            </div>
          </div>
        </div>

        {/* Section breakdown */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4">
          {Object.entries(atsAnalysis.sections).map(([key, value]) => (
            <div
              key={key}
              className="bg-secondary/50 rounded-xl p-3 sm:p-4 text-center sm:text-left"
            >
              <div className="text-xs text-muted-foreground capitalize mb-1">
                {key}
              </div>
              <div className={`text-xl font-semibold ${scoreColor(value)}`}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Keyword Gap */}
      <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
        <h2 className="text-lg sm:text-xl tracking-tight font-semibold text-foreground mb-4 font-mono">
          Keyword Match
        </h2>
        <div className="grid grid-cols-1 gap-5">
          <div>
            <div className="text-sm font-medium text-approved mb-2.5 font-sans">
              ✓ Matched ({atsAnalysis.matched_keywords.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {atsAnalysis.matched_keywords.map((kw, i) => (
                <span
                  key={i}
                  className="text-xs bg-approved/10 text-approved border border-approved/30 px-2.5 py-1 rounded-full"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium font-sans text-destructive mb-2.5">
              ✗ Missing ({atsAnalysis.missing_keywords.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {atsAnalysis.missing_keywords.map((kw, i) => (
                <span
                  key={i}
                  className="text-xs bg-correction/10 text-correction border border-correction/30 px-2.5 py-1 rounded-full"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Critical Issues & Quick Wins */}
      {(atsAnalysis.critical_issues.length > 0 ||
        atsAnalysis.quick_wins.length > 0) && (
        <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl tracking-tight font-semibold text-foreground mb-4 font-mono">
            Action Items
          </h2>
          {atsAnalysis.critical_issues.length > 0 && (
            <div className="mb-5">
              <div className="text-sm font-medium text-destructive mb-2">
                Critical Issues
              </div>
              <ul className="space-y-1">
                {atsAnalysis.critical_issues.map((issue, i) => (
                  <li
                    key={i}
                    className="text-sm text-foreground flex gap-2 leading-relaxed"
                  >
                    <span className="text-destructive flex-shrink-0">•</span>{" "}
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {atsAnalysis.quick_wins.length > 0 && (
            <div>
              <div className="text-sm font-medium text-primary mb-2">
                Quick Wins
              </div>
              <ul className="space-y-2">
                {atsAnalysis.quick_wins.map((win, i) => (
                  <li
                    key={i}
                    className="text-sm text-foreground flex gap-2 leading-relaxed"
                  >
                    <span className="text-primary flex-shrink-0">•</span> {win}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Tailored Resume */}
      <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl tracking-tight font-semibold text-foreground font-mono">
              Tailored Resume
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-xl">
              {acceptedResume
                ? "Showing your accepted edits — the original tailored resume is preserved below."
                : "Full resume with improved wording and ATS keywords added naturally."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <ExportResumeButton
              acceptedResume={acceptedResume ?? tailoredResume}
              filename={undefined}
            />

            <button
              onClick={copyTailoredResume}
              aria-label={
                copiedResume
                  ? "Tailored resume copied"
                  : "Copy tailored resume to clipboard"
              }
              className="text-xs font-medium text-primary hover:text-primary/80 whitespace-nowrap flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-3 py-1.5 bg-primary/10 hover:bg-primary/20 transition-colors"
            >
              {copiedResume ? "Copied!" : "Copy all"}
            </button>
          </div>
        </div>

        {tailoredResume.keywords_added.length > 0 && (
          <div className="mb-5">
            <div className="text-sm font-medium text-primary mb-2.5 font-sans">
              Keywords added
            </div>
            <div className="flex flex-wrap gap-2">
              {tailoredResume.keywords_added.map((kw, i) => (
                <span
                  key={i}
                  className="text-xs bg-primary/10 text-primary border border-primary/30 px-2.5 py-1 rounded-full"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        <pre className="whitespace-pre-wrap text-xs sm:text-sm text-foreground bg-secondary/50 rounded-xl p-4 sm:p-5 font-sans leading-relaxed overflow-x-auto border border-border/50">
          {acceptedResume?.full_text ?? tailoredResume.full_text}
        </pre>
      </div>

      {/* Suggested Changes (delegated component) */}
      {(bulletRewrites.length > 0 ||
        (totalSuggestionsAvailable ?? 0) > bulletRewrites.length) && (
        <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
          <SuggestedChanges
            bulletRewrites={bulletRewrites}
            totalSuggestionsAvailable={totalSuggestionsAvailable}
            suggestionLimit={suggestionLimit}
            onUpgradeClick={onUpgradeClick}
            onAccept={(index, selected) =>
              onAcceptSuggestion && onAcceptSuggestion(index, selected)
            }
          />
        </div>
      )}
    </div>
  );
}
