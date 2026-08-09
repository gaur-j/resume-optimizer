"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

interface Step {
  label: string;
  /** Relative pacing weight for this stage — used only to time the visual
   * progression, not a promise about real server timing. */
  weight: number;
}

const STEPS: Step[] = [
  { label: "Scoring your resume against the job description", weight: 0.4 },
  { label: "Rewriting weak bullet points", weight: 0.35 },
  { label: "Building your tailored resume", weight: 0.25 },
];

// Estimated total time to walk through all steps once, tuned against
// typical Groq/Gemini latency for this pipeline (see lib/ai.ts). This is a
// UX pacing heuristic, not a real progress signal — the API route doesn't
// stream stage events back to the client. Once the steps run out, the
// component holds on the final step (with its spinner still active) until
// the real fetch() in dashboard/page.tsx resolves and unmounts this.
const ESTIMATED_TOTAL_MS = 9000;

export function AnalysisProgress() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let stepIndex = 0;

    function scheduleNext() {
      if (cancelled || stepIndex >= STEPS.length - 1) return;
      const delay = STEPS[stepIndex].weight * ESTIMATED_TOTAL_MS;
      const timeoutId = setTimeout(() => {
        if (cancelled) return;
        stepIndex += 1;
        setCurrentStep(stepIndex);
        scheduleNext();
      }, delay);
      return timeoutId;
    }

    scheduleNext();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="motion-safe:animate-in motion-safe:fade-in rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xl"
    >
      <h2 className="mb-1 font-mono text-xl sm:text-2xl font-semibold text-foreground">
        Analyzing Your Resume
      </h2>
      <p className="mb-6 text-xs sm:text-sm text-muted-foreground font-sans">
        This usually takes a few seconds.
      </p>

      <ol className="space-y-4">
        {STEPS.map((step, index) => {
          const isDone = index < currentStep;
          const isActive = index === currentStep;

          return (
            <li key={step.label} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                {isDone ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : isActive ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                  <span className="block h-2 w-2 rounded-full bg-muted-foreground/30" />
                )}
              </span>

              <span
                className={`text-sm font-sans leading-6 ${
                  isActive
                    ? "text-foreground font-medium"
                    : isDone
                    ? "text-muted-foreground"
                    : "text-muted-foreground/60"
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Segmented progress bar mirroring the steps above */}
      <div className="mt-6 flex gap-1.5" aria-hidden="true">
        {STEPS.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
              index <= currentStep ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
