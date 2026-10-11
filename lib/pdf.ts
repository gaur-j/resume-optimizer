import { CanvasFactory } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";
import {
  MAX_PDF_PAGES,
  MAX_RESUME_CHARS,
  PDF_PARSE_TIMEOUT_MS,
} from "@/lib/limits";

/**
 * A PDF that is well-formed enough to open but exceeds our resource limits
 * (too many pages, too much text, or too slow to parse). Routes catch this
 * to show a specific message instead of a generic parse failure.
 */
export class PdfLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfLimitError";
  }
}

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

  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    const work = (async () => {
      // Page count comes from the document header, so this is cheap and
      // runs BEFORE any page is rendered: a 5 MB file that expands to
      // thousands of pages is rejected here rather than parsed.
      const info = await parser.getInfo();
      if (info.total > MAX_PDF_PAGES) {
        throw new PdfLimitError(
          `This PDF has ${info.total} pages. Resumes can be at most ${MAX_PDF_PAGES} pages.`
        );
      }

      // `first` is a belt-and-braces cap in case the header lies.
      const result = await parser.getText({ first: MAX_PDF_PAGES });
      const text = normalizeText(result.text);

      if (text.length > MAX_RESUME_CHARS) {
        throw new PdfLimitError(
          "This PDF contains too much text to be a resume."
        );
      }
      return text;
    })();

    // Hard wall-clock limit so a pathological PDF can't hold a request open.
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new PdfLimitError("This PDF took too long to read.")),
        PDF_PARSE_TIMEOUT_MS
      );
    });

    // If the timeout wins, `work` may still reject later; swallow it so it
    // doesn't surface as an unhandled rejection.
    work.catch(() => {});

    return await Promise.race([work, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
    await parser.destroy().catch(() => {});
  }
}
