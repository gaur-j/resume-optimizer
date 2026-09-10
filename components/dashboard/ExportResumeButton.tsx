"use client";

import { Check, Download, Loader2 } from "lucide-react";
import { useState } from "react";

import type { TailoredResume } from "@/types/analysis";

type Props = {
  acceptedResume: TailoredResume | null;
  filename?: string;
};

export default function ExportResumeButton({
  acceptedResume,
  filename,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState("");

  async function downloadPdf() {
    if (!acceptedResume || loading) return;

    setLoading(true);
    setDownloaded(false);
    setError("");

    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          acceptedResume,
          format: "pdf",
          filename,
        }),
      });

      if (!response.ok) {
        let message = "Unable to generate your PDF.";

        try {
          const data = await response.json();

          if (typeof data?.error === "string") {
            message = data.error;
          }
        } catch {
          // Keep the fallback message.
        }

        throw new Error(message);
      }

      const blob = await response.blob();

      if (!blob.size) {
        throw new Error("The generated PDF is empty.");
      }

      const contentDisposition =
        response.headers.get("Content-Disposition") ?? "";

      const match = contentDisposition.match(/filename="([^"]+)"/i);

      const outputFilename = match?.[1] ?? filename ?? "resume.pdf";

      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = outputFilename.endsWith(".pdf")
        ? outputFilename
        : `${outputFilename}.pdf`;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(url);

      setDownloaded(true);

      window.setTimeout(() => {
        setDownloaded(false);
      }, 1800);
    } catch (err) {
      console.error("PDF export failed:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate your PDF. Please try again."
      );
    } finally {
      setLoading(false);
    }
    7;
  }

  if (!acceptedResume) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={downloadPdf}
        disabled={loading}
        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60"
        aria-label={
          loading
            ? "Generating PDF"
            : downloaded
            ? "PDF downloaded"
            : "Download resume as PDF"
        }
      >
        {loading ? (
          <>
            {" "}
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Generating PDF…
          </>
        ) : downloaded ? (
          <>
            {" "}
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            Downloaded
          </>
        ) : (
          <>
            {" "}
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Download PDF
          </>
        )}{" "}
      </button>

      {error && (
        <p
          role="alert"
          className="max-w-[220px] text-right text-[11px] leading-4 text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}
