"use client";

import { useState } from "react";
import type { ATSAnalysis, BulletRewrite } from "@/types/analysis";

interface ResultsPanelProps {
  atsAnalysis: ATSAnalysis;
  bulletRewrites: BulletRewrite[];
}

function scoreColor(score: number) {
  if (score < 40) return "text-red-600";
  if (score < 70) return "text-amber-600";
  return "text-green-600";
}

function scoreRing(score: number) {
  if (score < 40) return "#dc2626";
  if (score < 70) return "#d97706";
  return "#16a34a";
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
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">ATS Score</h2>
        <div className="flex justify-center mb-4">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#e5e7eb"
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
            <div key={key} className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 capitalize mb-1">{key}</div>
              <div className={`text-lg font-semibold ${scoreColor(value)}`}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Keyword Gap */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Keyword Match
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <div className="text-sm font-medium text-green-700 mb-2">
              ✓ Matched ({atsAnalysis.matched_keywords.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {atsAnalysis.matched_keywords.map((kw, i) => (
                <span
                  key={i}
                  className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-200"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-red-700 mb-2">
              ✗ Missing ({atsAnalysis.missing_keywords.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {atsAnalysis.missing_keywords.map((kw, i) => (
                <span
                  key={i}
                  className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full border border-red-200"
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
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Action Items
          </h2>
          {atsAnalysis.critical_issues.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-medium text-red-700 mb-2">
                Critical Issues
              </div>
              <ul className="space-y-1">
                {atsAnalysis.critical_issues.map((issue, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-red-500">•</span> {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {atsAnalysis.quick_wins.length > 0 && (
            <div>
              <div className="text-sm font-medium text-blue-700 mb-2">
                Quick Wins
              </div>
              <ul className="space-y-1">
                {atsAnalysis.quick_wins.map((win, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-blue-500">•</span> {win}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Bullet Rewrites */}
      {bulletRewrites.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Suggested Rewrites
          </h2>
          <div className="space-y-4">
            {bulletRewrites.map((bullet, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">Original</div>
                <div className="text-sm text-gray-500 line-through mb-3">
                  {bullet.original}
                </div>
                {bullet.rewritten_options.map((option, j) => (
                  <div
                    key={j}
                    className="flex items-start justify-between gap-2 bg-green-50 rounded-lg p-3 mb-2 last:mb-0"
                  >
                    <p className="text-sm text-gray-800">{option}</p>
                    <button
                      onClick={() => copyBullet(option, i * 10 + j)}
                      className="text-xs text-blue-600 hover:text-blue-800 whitespace-nowrap flex-shrink-0"
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
