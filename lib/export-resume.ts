import { PDFDocument } from "pdf-lib";
import type { TailoredResume } from "@/types/analysis";
import { PdfLayoutEngine } from "@/lib/resume-templates/pdf-engine";
import { getTemplate } from "@/lib/resume-templates/registry";

/**
 * The actual PDF renderer. Access-gating (is this template locked for
 * this user?) happens one layer up, in app/api/export/route.ts - this
 * function trusts whatever templateId it's given and just renders it, so
 * it stays a pure rendering function rather than mixing in authorization.
 */
export async function createPdfBuffer(
  resume: TailoredResume,
  templateId?: string
): Promise<Uint8Array> {
  const style = getTemplate(templateId);
  const pdfDoc = await PDFDocument.create();
  const engine = await PdfLayoutEngine.create(pdfDoc, style);

  engine.renderResume(resume);

  return engine.save();
}

export async function exportResume(
  acceptedResume: TailoredResume | null,
  templateId?: string
): Promise<{
  buffer: Uint8Array;
  filename: string;
  mime: string;
} | null> {
  if (!acceptedResume) {
    return null;
  }

  const buffer = await createPdfBuffer(acceptedResume, templateId);

  return {
    buffer,
    filename: "tailored-resume.pdf",
    mime: "application/pdf",
  };
}
