"use client";

import { useState } from "react";
import type { ATSAnalysis, BulletRewrite } from "@/types/analysis";

interface ResultsPanelProps {
  atsAnalysis: ATSAnalysis;
  bulletRewrites: BulletRewrite[];
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
}: ResultsPanelProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  function copyBullet(text: string, index: number) {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  }

  const circumference = 2 * Math.PI * 45;
  const offset =
    circumference - (atsAnalysis.overall_score / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-xl tracking-normal font-semibold text-foreground mb-4 font-mono">
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
        <div className="grid grid-cols-2 gap-3 mt-4">
          {Object.entries(atsAnalysis.sections).map(([key, value]) => (
            <div key={key} className="bg-secondary rounded-lg p-3">
              <div className="text-xs text-muted-foreground capitalize mb-1">
                {key}
              </div>
              <div className={`text-lg font-semibold ${scoreColor(value)}`}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Keyword Gap */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 font-mono">
          Keyword Match
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <div className="text-sm font-medium text-approved mb-2 font-sans">
              ✓ Matched ({atsAnalysis.matched_keywords.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {atsAnalysis.matched_keywords.map((kw, i) => (
                <span
                  key={i}
                  className="text-xs bg-approved/10 text-approved border border-approved/30 px-2 py-1 rounded-full"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium font-sans text-destructive mb-2">
              ✗ Missing ({atsAnalysis.missing_keywords.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {atsAnalysis.missing_keywords.map((kw, i) => (
                <span
                  key={i}
                  className="text-xs bg-correction/10 text-correction border border-correction/30 px-2 py-1 rounded-full"
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
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Action Items
          </h2>
          {atsAnalysis.critical_issues.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-medium text-destructive mb-2">
                Critical Issues
              </div>
              <ul className="space-y-1">
                {atsAnalysis.critical_issues.map((issue, i) => (
                  <li key={i} className="text-sm text-foreground flex gap-2">
                    <span className="text-destructive">•</span> {issue}
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
              <ul className="space-y-1">
                {atsAnalysis.quick_wins.map((win, i) => (
                  <li key={i} className="text-sm text-foreground flex gap-2">
                    <span className="text-primary">•</span> {win}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Bullet Rewrites */}
      {bulletRewrites.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Suggested Rewrites
          </h2>
          <div className="space-y-4">
            {bulletRewrites.map((bullet, i) => (
              <div key={i} className="border border-border/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">
                  Original
                </div>
                <div className="text-sm text-muted-foreground line-through mb-3">
                  {bullet.original}
                </div>
                {bullet.rewritten_options.map((option, j) => (
                  <div
                    key={j}
                    className="flex items-start justify-between gap-2 bg-approved/10 rounded-lg p-3 mb-2 last:mb-0"
                  >
                    <p className="text-sm text-foreground">{option}</p>
                    <button
                      onClick={() => copyBullet(option, i * 10 + j)}
                      aria-label={
                        copiedIndex === i * 10 + j
                          ? "Copied to clipboard"
                          : "Copy this rewrite to clipboard"
                      }
                      className="text-xs text-primary hover:text-primary-foreground whitespace-nowrap flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1"
                    >
                      {copiedIndex === i * 10 + j ? "Copied!" : "Copy"}
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
