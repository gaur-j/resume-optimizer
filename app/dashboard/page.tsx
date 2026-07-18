"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { CreditsCard } from "@/components/dashboard/CreditsCard";
import { BuyCreditsModal } from "@/components/dashboard/BuyCreditsModal";
import { ResultsPanel } from "@/components/dashboard/ResultsPanel";
import type { ATSAnalysis, BulletRewrite } from "@/types/analysis";

interface AnalysisResults {
  scan_id: string;
  ats_analysis: ATSAnalysis;
  bullet_rewrites: BulletRewrite[];
}

export default function DashboardPage() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [error, setError] = useState("");

  const [credits, setCredits] = useState<number | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [showBuyModal, setShowBuyModal] = useState(false);

  const supabase = createClient();

  const fetchCredits = useCallback(async () => {
    setCreditsLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setCreditsLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("users")
      .select("scan_credits")
      .eq("id", user.id)
      .single();

    if (fetchError) {
      console.error("Failed to fetch credits:", fetchError);
    }

    setCredits(data?.scan_credits ?? 0);
    setCreditsLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();

    if (!resumeText.trim() || !jobDescription.trim()) {
      setError("Please fill in both resume and job description");
      return;
    }

    if (credits !== null && credits <= 0) {
      setShowBuyModal(true);
      return;
    }

    setLoading(true);
    setError("");
    setResults(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_text: resumeText,
          jd_text: jobDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          setShowBuyModal(true);
        }
        setError(data.error || "Analysis failed");
        return;
      }

      setResults(data.data);
      fetchCredits(); // reflect the credit that was just spent
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Input Section */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Analyze Your Resume
          </h1>

          <form onSubmit={handleAnalyze} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Resume
              </label>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume text here..."
                className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading || creditsLoading}
            >
              {loading ? "Analyzing..." : "Get ATS Score"}
            </Button>
          </form>
        </div>

        {/* Results now render below the form once available */}
        {results && (
          <ResultsPanel
            atsAnalysis={results.ats_analysis}
            bulletRewrites={results.bullet_rewrites}
          />
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <CreditsCard
          credits={credits}
          loading={creditsLoading}
          onBuyMore={() => setShowBuyModal(true)}
        />

        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Tips</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• Use keywords from the job description</li>
            <li>• Include quantified achievements</li>
            <li>• Keep formatting simple and clean</li>
          </ul>
        </div>
      </div>

      {showBuyModal && (
        <BuyCreditsModal
          onClose={() => setShowBuyModal(false)}
          onSuccess={() => {
            setShowBuyModal(false);
            fetchCredits();
          }}
        />
      )}
    </div>
  );
}
