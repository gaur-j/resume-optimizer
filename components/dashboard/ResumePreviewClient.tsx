"use client";

import React from "react";
import ResumePreview, {
  TailoredResume,
} from "@/components/dashboard/ResumePreview";

type Props = {
  tailoredResume: TailoredResume;
  showPrintButton?: boolean;
};

export default function ResumePreviewClient({
  tailoredResume,
  showPrintButton = true,
}: Props) {
  return (
    <div className="relative">
      {showPrintButton && (
        <div className="mb-4 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium shadow-sm hover:bg-primary/90"
          >
            Print / Save PDF
          </button>
        </div>
      )}

      <ResumePreview tailoredResume={tailoredResume} />
    </div>
  );
}
