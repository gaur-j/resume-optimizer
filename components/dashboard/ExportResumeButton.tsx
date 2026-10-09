"use client";

import { Check, ChevronDown, Download, Loader2, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TailoredResume } from "@/types/analysis";

type Template = {
  id: string;
  name: string;
  description: string;
  tier: "free" | "paid";
  locked: boolean;
};

// Shown immediately (before /api/templates resolves) so the Download
// button works right away without waiting on a network round trip - this
// is always unlocked and always exists, matching the registry's default.
const FALLBACK_TEMPLATE: Template = {
  id: "classic",
  name: "Classic",
  description: "",
  tier: "free",
  locked: false,
};

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

  const [templates, setTemplates] = useState<Template[]>([FALLBACK_TEMPLATE]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("classic");

  useEffect(() => {
    let active = true;

    fetch("/api/templates")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && Array.isArray(data?.templates)) {
          setTemplates(data.templates);
        }
      })
      .catch(() => {
        // Keep the fallback - the picker just won't show the extra
        // templates this session, but Download still works.
      });

    return () => {
      active = false;
    };
  }, []);

  const selectedTemplate =
    templates.find((t) => t.id === selectedTemplateId) ?? FALLBACK_TEMPLATE;

  function handleTemplateSelect(id: string) {
    const template = templates.find((t) => t.id === id);

    if (template?.locked) {
      // Visible-but-disabled per the spec: clicking a locked template
      // doesn't select it, but it's fully clickable and explains why,
      // rather than being inert - that's the upsell surface.
      toast.info(`${template.name} requires a subscription.`, {
        description: "Subscribe from the dashboard to unlock all templates.",
      });
      return;
    }

    setSelectedTemplateId(id);
  }

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
          templateId: selectedTemplateId,
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
  }

  if (!acceptedResume) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={downloadPdf}
          disabled={loading}
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-l-lg border-r border-primary-foreground/20 bg-primary px-3.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-60"
          aria-label={
            loading
              ? "Generating PDF"
              : downloaded
              ? "PDF downloaded"
              : `Download resume as PDF (${selectedTemplate.name} template)`
          }
        >
          {loading ? (
            <>
              <Loader2
                className="h-3.5 w-3.5 animate-spin"
                aria-hidden="true"
              />
              Generating…
            </>
          ) : downloaded ? (
            <>
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Downloaded
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Download PDF
            </>
          )}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger
            type="button"
            disabled={loading}
            className="inline-flex min-h-9 items-center gap-1 rounded-r-lg bg-primary px-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-60"
            aria-label={`Choose template, currently ${selectedTemplate.name}`}
          >
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuRadioGroup
              value={selectedTemplateId}
              onValueChange={handleTemplateSelect}
            >
              {templates.map((template) => (
                <DropdownMenuRadioItem
                  key={template.id}
                  value={template.id}
                  className={template.locked ? "opacity-70" : undefined}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    <span className="truncate font-medium">
                      {template.name}
                    </span>
                    {template.locked && (
                      <Lock
                        className="h-3 w-3 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
