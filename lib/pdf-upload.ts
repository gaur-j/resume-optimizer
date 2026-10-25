import { NextResponse, type NextRequest } from "next/server";
import { extractTextFromPDF, PdfLimitError } from "@/lib/pdf";
import { MAX_PDF_BYTES, MULTIPART_OVERHEAD_BYTES } from "@/lib/limits";
import { PayloadTooLargeError, readLimitedFormData } from "@/lib/request-body";
import { reportError } from "@/lib/monitoring";

/**
 * Everything the two PDF upload routes have in common: bounded body read,
 * file/size/signature checks, text extraction with the parser limits, and
 * consistent JSON responses.
 *
 * The routes differ only in WHO may call them (a signed-in user vs. an
 * IP-rate-limited visitor), the minimum amount of text, and some wording -
 * so each route keeps its own gate and passes its messages in here. That way
 * the validation logic exists once and cannot drift between the two.
 */
export interface PdfUploadOptions {
  minTextLength: number;
  /** Prefix for server-side logs of extraction failures. */
  extractionLogLabel: string;
  /** Prefix for server-side logs of unexpected failures. */
  uploadLogLabel: string;
  messages: {
    noFile: string;
    tooLarge: string;
    notPdf: string;
    unreadable: string;
    tooLittleText: string;
    serverError: string;
  };
}

function isPdfSignature(bytes: Uint8Array) {
  // PDF files start with "%PDF-"
  return (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  );
}

function normalizeExtractedText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function handlePdfUpload(
  request: NextRequest,
  options: PdfUploadOptions
): Promise<NextResponse> {
  const { messages } = options;

  try {
    const formData = await readLimitedFormData(
      request,
      MAX_PDF_BYTES + MULTIPART_OVERHEAD_BYTES
    );
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError(messages.noFile, 400);
    }

    if (file.size === 0) {
      return jsonError("The uploaded file is empty.", 400);
    }

    if (file.size > MAX_PDF_BYTES) {
      return jsonError(messages.tooLarge, 400);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());

    if (!isPdfSignature(bytes)) {
      return jsonError(messages.notPdf, 400);
    }

    let extractedText: string;

    try {
      extractedText = await extractTextFromPDF(Buffer.from(bytes));
    } catch (error) {
      console.error(options.extractionLogLabel, error);

      if (error instanceof PdfLimitError) {
        return jsonError(error.message, 422);
      }

      return jsonError(messages.unreadable, 422);
    }

    const normalizedText = normalizeExtractedText(extractedText);

    if (normalizedText.length < options.minTextLength) {
      return jsonError(messages.tooLittleText, 422);
    }

    return NextResponse.json({ success: true, data: { text: normalizedText } });
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return jsonError(messages.tooLarge, 413);
    }

    console.error(options.uploadLogLabel, error);
    await reportError("pdf.upload.error", error);
    return jsonError(messages.serverError, 500);
  }
}
