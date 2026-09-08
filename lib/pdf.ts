import { CanvasFactory } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";

const PAGE_MARKER = /\n*--\s*\d+\s*of\s*\d+\s*--\n*/g;

function normalizeText(text: string) {
  return text
    .replace(PAGE_MARKER, "\n\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  if (!buffer.length) {
    throw new Error("Cannot parse an empty PDF.");
  }

  const parser = new PDFParse({
    data: new Uint8Array(buffer),
    CanvasFactory,
  });

  try {
    const result = await parser.getText();
    return normalizeText(result.text);
  } finally {
    await parser.destroy();
  }
}
