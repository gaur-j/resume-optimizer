"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, FileSearch, Loader2, Sparkles } from "lucide-react";

const STEPS = [
  {
    label: "Scoring your resume against the job",
    description: "Comparing your experience with the target role.",
    icon: FileSearch,
  },
  {
    label: "Finding improvement opportunities",
    description: "Identifying weak bullets, missing keywords, and gaps.",
    icon: Sparkles,
  },
  {
    label: "Preparing your tailored results",
    description: "Building the recommendations you can review and apply.",
    icon: Sparkles,
  },
] as const;

export function AnalysisProgress() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // This is intentionally only a soft visual cue.
    // It never claims that the server has completed a particular stage.
    const timeoutIds = [
      window.setTimeout(() => setCurrentStep(1), 2500),
      window.setTimeout(() => setCurrentStep(2), 5500),
    ];

    return () => {
      timeoutIds.forEach(window.clearTimeout);
    };
  }, []);

  return (
    <section
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm sm:rounded-3xl"
    >
      {" "}
      <div className="border-b border-border px-4 py-5 sm:px-6 sm:py-6">
        {" "}
        <div className="flex items-start gap-3">
          {" "}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {" "}
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />{" "}
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground sm:text-lg">
              Analyzing your resume
            </h2>

            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              We&apos;re comparing your resume with the target job and preparing
              your recommendations.
            </p>
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-6 lg:p-8">
        <ol className="space-y-5">
          {STEPS.map((step, index) => {
            const isDone = index < currentStep;
            const isActive = index === currentStep;
            const Icon = step.icon;

            return (
              <li key={step.label} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center">
                  {isDone ? (
                    <CheckCircle2
                      className="h-5 w-5 text-success"
                      aria-hidden="true"
                    />
                  ) : isActive ? (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                  ) : (
                    <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/25" />
                  )}
                </div>

                <div className="min-w-0">
                  <p
                    className={`text-sm leading-5 ${
                      isActive
                        ? "font-medium text-foreground"
                        : isDone
                        ? "text-muted-foreground"
                        : "text-muted-foreground/60"
                    }`}
                  >
                    {step.label}
                  </p>

                  <p
                    className={`mt-1 text-xs leading-5 ${
                      isActive
                        ? "text-muted-foreground"
                        : "text-muted-foreground/50"
                    }`}
                  >
                    {step.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-7">
          <div
            className="h-1.5 overflow-hidden rounded-full bg-muted"
            aria-hidden="true"
          >
            <div className="h-full w-2/5 animate-pulse rounded-full bg-primary" />
          </div>

          <div className="mt-3 flex items-center justify-between gap-4 text-xs text-muted-foreground">
            <span>Processing securely</span>
            <span>Usually takes a few seconds</span>
          </div>
        </div>
      </div>
    </section>
  );
}
