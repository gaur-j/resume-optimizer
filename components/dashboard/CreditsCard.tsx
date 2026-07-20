"use client";

import { Button } from "@/components/ui/button";

interface CreditsCardProps {
  credits: number | null;
  loading: boolean;
  onBuyMore: () => void;
}

export function CreditsCard({ credits, loading, onBuyMore }: CreditsCardProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Your Credits
      </h2>
      <div className="text-center">
        {loading ? (
          <div className="text-4xl font-bold text-muted-foreground mb-2 animate-pulse">
            —
          </div>
        ) : (
          <div
            className={`text-4xl font-bold mb-2 ${
              credits === 0 ? "text-destructive" : "text-primary"
            }`}
          >
            {credits}
          </div>
        )}
        <p className="text-sm text-muted-foreground mb-6">
          {credits === 0 ? "No scans remaining" : "Scans available"}
        </p>
        <Button
          onClick={onBuyMore}
          className="w-full bg-primary hover:bg-primary/90"
        >
          Get More Scans
        </Button>
      </div>
    </div>
  );
}
