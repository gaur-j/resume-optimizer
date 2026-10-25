import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { extractTextFromPDF, PdfLimitError } from "@/lib/pdf";

async function makePdf(
  pages: number,
  linesPerPage = 1,
  text = "Jane Doe Senior Engineer built scalable systems"
) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pages; i++) {
    const page = doc.addPage([612, 792]);
    for (let l = 0; l < linesPerPage; l++)
      page.drawText(text, { x: 10, y: 780 - l * 11, size: 6, font });
  }
  return Buffer.from(await doc.save());
}

describe("PDF extraction limits", () => {
  test("a normal PDF is read", async () => {
    assert.ok(
      (await extractTextFromPDF(await makePdf(2))).includes("Jane Doe")
    );
  });

  test("a PDF exactly at the page cap is accepted", async () => {
    await extractTextFromPDF(await makePdf(10));
  });

  test("a huge page count is rejected from the header, before parsing", async () => {
    const started = Date.now();
    await assert.rejects(extractTextFromPDF(await makePdf(200)), PdfLimitError);
    assert.ok(Date.now() - started < 5000);
  });

  test("an absurd amount of text is rejected", async () => {
    const dense = await makePdf(
      10,
      70,
      "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut"
    );
    await assert.rejects(extractTextFromPDF(dense), PdfLimitError);
  });

  test("garbage with a valid header fails as a normal parse error, not a limit error", async () => {
    await assert.rejects(
      extractTextFromPDF(Buffer.from("%PDF-1.7\n" + "garbage".repeat(500))),
      (error: unknown) =>
        error instanceof Error && !(error instanceof PdfLimitError)
    );
  });

  test("an empty buffer is rejected", async () => {
    await assert.rejects(extractTextFromPDF(Buffer.alloc(0)));
  });
});
