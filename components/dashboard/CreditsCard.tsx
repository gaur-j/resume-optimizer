"use client";

import { Button } from "@/components/ui/button";

interface CreditsCardProps {
  credits: number | null;
  loading: boolean;
  onBuyMore: () => void;
}

export function CreditsCard({ credits, loading, onBuyMore }: CreditsCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Credits</h2>
      <div className="text-center">
        {loading ? (
          <div className="text-4xl font-bold text-gray-300 mb-2 animate-pulse">
            —
          </div>
        ) : (
          <div
            className={`text-4xl font-bold mb-2 ${
              credits === 0 ? "text-red-500" : "text-blue-600"
            }`}
          >
            {credits}
          </div>
        )}
        <p className="text-sm text-gray-600 mb-6">
          {credits === 0 ? "No scans remaining" : "Scans available"}
        </p>
        <Button
          onClick={onBuyMore}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          Get More Scans
        </Button>
      </div>
    </div>
  );
}
