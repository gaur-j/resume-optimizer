"use client";

import { useMemo, useState } from "react";
import { Check, X, Lock, Sparkles, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BulletRewrite } from "@/types/analysis";

type Status = "pending" | "accepted" | "rejected";

type Props = {
  bulletRewrites: BulletRewrite[];
  onAccept: (index: number, selected: string) => void;
  onReject?: (index: number) => void;
  /**
   * Total suggestions the AI actually generated for this resume, which may
   * be more than bulletRewrites.length if the server already truncated the
   * array for a free-tier user. Falls back to bulletRewrites.length so this
   * component still works if a caller doesn't pass it.
   */
  totalSuggestionsAvailable?: number;
  /** Whether this user has ever purchased credits — unlocks every suggestion. */
  suggestionLimit: number;
  /** Opens the buy-credits modal. */
  onUpgradeClick?: () => void;
};

export default function SuggestedChanges({
  bulletRewrites,
  onAccept,
  onReject,
  totalSuggestionsAvailable,
  suggestionLimit,
  onUpgradeClick,
}: Props) {
  const [status, setStatus] = useState<Record<number, Status>>({});
  const [selectedText, setSelectedText] = useState<Record<number, string>>({});

  const visible = bulletRewrites ?? []; // server already truncated this if free-tier
  const total = totalSuggestionsAvailable ?? visible.length;
  // Dynamically calculate locked features based on their specific tier limit
  const lockedCount = Math.max(total - suggestionLimit, 0);
  const isFullyUnlocked = suggestionLimit >= total;

  const { acceptedCount, rejectedCount, pendingCount } = useMemo(() => {
    let acceptedN = 0;
    let rejectedN = 0;
    visible.forEach((_, i) => {
      if (status[i] === "accepted") acceptedN++;
      else if (status[i] === "rejected") rejectedN++;
    });
    return {
      acceptedCount: acceptedN,
      rejectedCount: rejectedN,
      pendingCount: visible.length - acceptedN - rejectedN,
    };
  }, [status, visible]);

  function handleAccept(i: number, option: string) {
    setStatus((s) => ({ ...s, [i]: "accepted" }));
    setSelectedText((s) => ({ ...s, [i]: option }));
    onAccept(i, option);
  }

  function handleReject(i: number) {
    setStatus((s) => ({ ...s, [i]: "rejected" }));
    onReject?.(i);
  }

  function handleUndo(i: number) {
    setStatus((s) => {
      const next = { ...s };
      delete next[i];
      return next;
    });
  }

  function handleAcceptAllVisible() {
    // Deliberately loops over `visible` only — never the locked/hidden
    // suggestions a free user hasn't unlocked. This is what stops "Accept
    // All" from silently applying suggestions the user never actually saw.
    visible.forEach((b, i) => {
      if (status[i]) return; // don't re-trigger already-decided ones
      const first = b.rewritten_options[0];
      if (first) handleAccept(i, first);
    });
  }

  function handleRejectAllVisible() {
    visible.forEach((_, i) => {
      if (status[i]) return;
      handleReject(i);
    });
  }

  if (visible.length === 0 && lockedCount === 0) return null;

  const reviewedCount = acceptedCount + rejectedCount;
  const progressPct =
    visible.length > 0 ? (reviewedCount / visible.length) * 100 : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Sparkles
              className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0"
              aria-hidden="true"
            />
            <h2 className="font-mono text-lg sm:text-xl tracking-tight font-semibold text-foreground">
              Suggested Changes
            </h2>
            {/* Dynamic Badge rendering */}
            {!isFullyUnlocked && (
              <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/30 whitespace-nowrap">
                {suggestionLimit <= 3 ? "Free plan" : "Basic Plan"}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
            {acceptedCount} accepted · {rejectedCount} rejected · {pendingCount}{" "}
            pending
          </p>
        </div>

        {visible.length > 0 && (
          <div className="flex w-full sm:w-auto gap-2 sm:gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={handleAcceptAllVisible}
              className="flex-1 sm:flex-none"
              disabled={pendingCount === 0}
            >
              Accept all
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="flex-1 sm:flex-none text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleRejectAllVisible}
              disabled={pendingCount === 0}
            >
              Reject all
            </Button>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {visible.length > 0 && (
        <div
          className="h-1.5 w-full rounded-full bg-secondary overflow-hidden mb-6"
          role="progressbar"
          aria-valuenow={Math.round(progressPct)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-primary transition-[width] duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      <div className="space-y-4 sm:space-y-5">
        {visible.map((b, i) => {
          const s = status[i] ?? "pending";

          if (s === "accepted") {
            return (
              <div
                key={i}
                className="motion-safe:animate-in motion-safe:fade-in rounded-xl border border-approved/30 bg-approved/10 p-4 sm:p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-approved text-background">
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground leading-relaxed">
                      {selectedText[i] ?? b.rewritten_options[0]}
                    </p>
                    <p className="text-xs text-approved mt-2 font-medium">
                      Applied to your tailored resume
                    </p>
                  </div>
                </div>
              </div>
            );
          }

          if (s === "rejected") {
            return (
              <div
                key={i}
                className="motion-safe:animate-in motion-safe:fade-in rounded-xl border border-border bg-secondary/50 p-4 sm:p-5"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <p className="text-sm text-muted-foreground line-through leading-relaxed">
                    {b.original}
                  </p>
                  <button
                    onClick={() => handleUndo(i)}
                    className="flex w-full sm:w-auto items-center justify-center sm:justify-start gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-3 py-2 bg-background sm:bg-transparent border border-border sm:border-transparent transition-colors"
                  >
                    <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Undo
                  </button>
                </div>
              </div>
            );
          }

          // pending
          return (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm"
            >
              <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                Original
              </div>
              <p className="text-sm text-muted-foreground line-through mb-4 leading-relaxed">
                {b.original}
              </p>

              <div className="space-y-3">
                {b.rewritten_options.map((opt, j) => (
                  <div
                    key={j}
                    className="group flex flex-col sm:flex-row sm:items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-colors p-3 sm:p-4"
                  >
                    <div className="flex gap-3 flex-1">
                      <Sparkles
                        className="h-4 w-4 text-primary mt-0.5 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <p className="text-sm text-foreground leading-relaxed">
                        {opt}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto flex-shrink-0 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground shadow-sm"
                      onClick={() => handleAccept(i, opt)}
                    >
                      <Check className="h-4 w-4 mr-1.5" aria-hidden="true" />
                      Use this
                    </Button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleReject(i)}
                className="mt-4 flex w-full sm:w-auto items-center justify-center sm:justify-start gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-3 py-2 bg-secondary/50 sm:bg-transparent transition-colors"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Reject this suggestion
              </button>
            </div>
          );
        })}

        {/* Dynamic Upgrade teaser */}
        {lockedCount > 0 && (
          <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-5 sm:p-6 mt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Lock className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm sm:text-base font-medium text-foreground">
                    {lockedCount} more premium rewrite
                    {lockedCount > 1 ? "s" : ""} available
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Upgrade your plan to unlock the remaining AI suggestions.
                  </p>
                </div>
              </div>
              <Button
                onClick={onUpgradeClick}
                className="w-full sm:w-auto flex-shrink-0 bg-primary hover:bg-primary/90 shadow-md"
              >
                Upgrade to unlock →
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
