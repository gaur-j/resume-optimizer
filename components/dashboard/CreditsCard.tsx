"use client";

import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";

interface CreditsCardProps {
  credits: number | null;
  loading: boolean;
  onBuyMore: () => void;
}

export function CreditsCard({ credits, loading, onBuyMore }: CreditsCardProps) {
  const isEmpty = !loading && credits === 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-(--shadow-xs) sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Coins className="h-4 w-4" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            Remaining credits
          </p>
          <p className="text-xs text-muted-foreground">
            {isEmpty ? "No scans remaining" : "Scans available"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        {loading ? (
          <div className="h-10 w-12 animate-pulse rounded-md bg-muted" />
        ) : (
          <p
            className={`font-mono text-4xl font-semibold tabular-nums leading-none ${
              isEmpty ? "text-correction" : "text-foreground"
            }`}
          >
            {credits}
          </p>
        )}

        <Button
          onClick={onBuyMore}
          size="sm"
          className="rounded-lg shadow-sm"
          variant={isEmpty ? "default" : "outline"}
        >
          Get more
        </Button>
      </div>
    </div>
  );
}
