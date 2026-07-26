"use client";

import React, { useState } from "react";
import type { BulletRewrite } from "@/types/analysis";

type Props = {
  bulletRewrites: BulletRewrite[];
  onAccept: (index: number, selected: string) => void;
  onReject?: (index: number) => void;
  onAcceptAll?: () => void;
  onRejectAll?: () => void;
};

export default function SuggestedChanges({
  bulletRewrites,
  onAccept,
  onReject,
  onAcceptAll,
  onRejectAll,
}: Props) {
  const [rejected, setRejected] = useState<Record<number, boolean>>({});

  function handleReject(i: number) {
    setRejected((s) => ({ ...s, [i]: true }));
    onReject && onReject(i);
  }

  function handleAccept(i: number, option: string) {
    // mark as not rejected and notify parent
    setRejected((s) => ({ ...s, [i]: false }));
    onAccept(i, option);
  }

  if (!bulletRewrites || bulletRewrites.length === 0) return null;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div className="text-lg font-semibold">Suggested Changes</div>
        <div className="flex gap-2">
          <button
            onClick={() => onAcceptAll && onAcceptAll()}
            className="text-xs px-2 py-1 bg-primary text-white rounded-md"
          >
            Accept All
          </button>
          <button
            onClick={() => onRejectAll && onRejectAll()}
            className="text-xs px-2 py-1 bg-destructive text-white rounded-md"
          >
            Reject All
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {bulletRewrites.map((b, i) => {
          if (rejected[i]) {
            return (
              <div
                key={i}
                className="p-3 rounded-lg border border-border/40 bg-muted"
              >
                <div className="text-sm text-muted-foreground">
                  Suggestion rejected
                </div>
                <div className="text-sm line-through text-muted-foreground mt-2">
                  {b.original}
                </div>
              </div>
            );
          }

          return (
            <div key={i} className="border border-border/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Original</div>
              <div className="text-sm text-muted-foreground line-through mb-3">
                {b.original}
              </div>

              <div className="space-y-2">
                {b.rewritten_options.map((opt, j) => (
                  <div
                    key={j}
                    className="flex items-start justify-between gap-2 bg-approved/10 rounded-lg p-3 mb-2 last:mb-0"
                  >
                    <p className="text-sm text-foreground">{opt}</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAccept(i, opt)}
                        className="text-xs bg-primary/10 text-primary hover:bg-primary/20 whitespace-nowrap flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-2 py-0.5"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(i)}
                        className="text-xs text-destructive hover:underline"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
