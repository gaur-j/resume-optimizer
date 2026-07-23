"use client";

import { Button } from "@/components/ui/button";

interface CreditsCardProps {
  credits: number | null;
  loading: boolean;
  onBuyMore: () => void;
}

export function CreditsCard({ credits, loading, onBuyMore }: CreditsCardProps) {
  return (
    <div className="bg-secondary rounded-lg border border-border p-6 shadow-xl">
      <h2 className="text-lg font-semibold font-mono text-foreground mb-4">
        Your Credits
      </h2>
      <div className="text-center">
        {loading ? (
          <div className="text-4xl font-bold text-muted-foreground mb-2 animate-pulse">
            —
          </div>
        ) : (
          <div
            className={`text-4xl font-bold mb-2 font-sans ${
              credits === 0 ? "text-correction" : "text-approved"
            }`}
          >
            {credits}
          </div>
        )}
        <p
          className={`text-sm mb-6 font-sans ${
            credits === 0 ? "text-correction" : "text-muted-foreground"
          }`}
        >
          {credits === 0 ? "No scans remaining" : "Scans available"}
        </p>
        <Button
          onClick={onBuyMore}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-sans shadow-sm"
        >
          Get More Scans
        </Button>
      </div>
    </div>
  );
}
