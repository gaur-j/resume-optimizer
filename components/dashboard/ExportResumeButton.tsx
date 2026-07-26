"use client";

import React, { useState } from "react";
import type { TailoredResume } from "@/types/analysis";

type Props = {
  acceptedResume: TailoredResume | null;
  filename?: string;
};

export default function ExportResumeButton({
  acceptedResume,
  filename,
}: Props) {
  const [loadingFormat, setLoadingFormat] = useState<string | null>(null);

  async function download(format: "pdf" | "docx" | "txt") {
    if (!acceptedResume) return;
    setLoadingFormat(format);

    try {
      const resp = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acceptedResume, format, filename }),
      });

      if (!resp.ok) {
        console.error("Export failed", resp.statusText);
        setLoadingFormat(null);
        return;
      }

      const arrayBuffer = await resp.arrayBuffer();
      const mime =
        resp.headers.get("Content-Type") || "application/octet-stream";
      const disp = resp.headers.get("Content-Disposition") || "attachment";
      const matches = /filename="(.+)"/.exec(disp || "");
      const outName = matches ? matches[1] : filename || `resume.${format}`;

      const blob = new Blob([arrayBuffer], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = outName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setLoadingFormat(null);
    }
  }

  if (!acceptedResume) return null;

  return (
    <div className="flex gap-2 items-center">
      <button
        onClick={() => download("pdf")}
        className="text-xs bg-primary px-2 py-1 rounded-md text-white"
        disabled={!!loadingFormat}
      >
        {loadingFormat === "pdf" ? "Exporting PDF..." : "Export PDF"}
      </button>

      <button
        onClick={() => download("docx")}
        className="text-xs bg-secondary px-2 py-1 rounded-md"
        disabled={!!loadingFormat}
      >
        {loadingFormat === "docx" ? "Exporting DOCX..." : "Export DOCX"}
      </button>

      <button
        onClick={() => download("txt")}
        className="text-xs bg-muted px-2 py-1 rounded-md"
        disabled={!!loadingFormat}
      >
        {loadingFormat === "txt" ? "Exporting..." : "Export TXT"}
      </button>
    </div>
  );
}
