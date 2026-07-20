import { PDFParse } from "pdf-parse";

// pdf-parse v2 inserts a footer like "-- 1 of 3 --" after every page's
// text. Harmless for humans reading the raw output, but it pollutes both
// what the user sees in the editable textarea and what gets sent to the
// AI for analysis — so it's stripped here, once, at the source.
const PAGE_MARKER = /\n*--\s*\d+\s*of\s*\d+\s*--\n*/g;

export async function extractTextFromPDF(buffer: Buffer) {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return result.text.replace(PAGE_MARKER, "\n\n").trim();
  } finally {
    await parser.destroy();
  }
}
