import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type {
  TailoredResume,
  TailoredResumeLine,
  TailoredResumeSection,
} from "@/types/analysis";

const PAGE_WIDTH = 612; // US Letter
const PAGE_HEIGHT = 792;

const MARGIN_X = 54;
const MARGIN_TOP = 48;
const MARGIN_BOTTOM = 48;

const BODY_SIZE = 10;
const BODY_LINE_HEIGHT = 14;

const SECTION_SIZE = 11;
const SECTION_LINE_HEIGHT = 14;

const NAME_SIZE = 20;
const NAME_LINE_HEIGHT = 24;

const SUBHEADING_SIZE = 10.5;

function cleanText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u0000/g, "")
    .trim();
}

function wrapText(
  text: string,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  fontSize: number,
  maxWidth: number
): string[] {
  const cleaned = cleanText(text);

  if (!cleaned) {
    return [];
  }

  const paragraphs = cleaned.split("\n");
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();

    if (!trimmed) {
      lines.push("");
      continue;
    }

    const words = trimmed.split(/\s+/);
    let current = "";

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;

      if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
        current = candidate;
        continue;
      }

      if (current) {
        lines.push(current);
      }

      // Prevent a single unusually long token from disappearing.
      if (font.widthOfTextAtSize(word, fontSize) <= maxWidth) {
        current = word;
        continue;
      }

      let chunk = "";

      for (const character of word) {
        const candidateChunk = chunk + character;

        if (font.widthOfTextAtSize(candidateChunk, fontSize) <= maxWidth) {
          chunk = candidateChunk;
        } else {
          if (chunk) {
            lines.push(chunk);
          }

          chunk = character;
        }
      }

      current = chunk;
    }

    if (current) {
      lines.push(current);
    }
  }

  return lines;
}

export async function createPdfBuffer(
  resume: TailoredResume
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  let cursorY = PAGE_HEIGHT - MARGIN_TOP;

  const contentWidth = PAGE_WIDTH - MARGIN_X * 2;

  function addPage() {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

    cursorY = PAGE_HEIGHT - MARGIN_TOP;
  }

  function ensureSpace(height: number) {
    if (cursorY - height < MARGIN_BOTTOM) {
      addPage();
    }
  }

  function drawWrapped(
    text: string,
    options: {
      font?: typeof regularFont;
      size?: number;
      lineHeight?: number;
      indent?: number;
      spacingAfter?: number;
    } = {}
  ) {
    const font = options.font ?? regularFont;

    const size = options.size ?? BODY_SIZE;

    const lineHeight = options.lineHeight ?? BODY_LINE_HEIGHT;

    const indent = options.indent ?? 0;

    const spacingAfter = options.spacingAfter ?? 0;

    const maxWidth = contentWidth - indent;

    const lines = wrapText(text, font, size, maxWidth);

    for (const line of lines) {
      if (!line) {
        cursorY -= lineHeight / 2;
        continue;
      }

      ensureSpace(lineHeight);

      page.drawText(line, {
        x: MARGIN_X + indent,
        y: cursorY,
        size,
        font,
        color: rgb(0, 0, 0),
      });

      cursorY -= lineHeight;
    }

    cursorY -= spacingAfter;
  }

  function drawBullet(text: string) {
    const indent = 14;
    const bulletWidth = 8;

    const lines = wrapText(
      cleanText(text),
      regularFont,
      BODY_SIZE,
      contentWidth - indent
    );

    if (lines.length === 0) {
      return;
    }

    for (let index = 0; index < lines.length; index++) {
      ensureSpace(BODY_LINE_HEIGHT);

      if (index === 0) {
        page.drawText("•", {
          x: MARGIN_X,
          y: cursorY,
          size: BODY_SIZE,
          font: regularFont,
          color: rgb(0, 0, 0),
        });
      }

      page.drawText(lines[index], {
        x: MARGIN_X + indent,
        y: cursorY,
        size: BODY_SIZE,
        font: regularFont,
        color: rgb(0, 0, 0),
      });

      cursorY -= BODY_LINE_HEIGHT;
    }

    cursorY -= 2;
  }

  function drawSectionHeading(heading: string) {
    const text = cleanText(heading).toUpperCase();

    if (!text) return;

    ensureSpace(SECTION_LINE_HEIGHT + 10);

    cursorY -= 5;

    page.drawText(text, {
      x: MARGIN_X,
      y: cursorY,
      size: SECTION_SIZE,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    cursorY -= SECTION_LINE_HEIGHT;

    // Small divider line gives structure without
    // introducing graphics that can hurt ATS readability.
    page.drawLine({
      start: {
        x: MARGIN_X,
        y: cursorY + 3,
      },
      end: {
        x: PAGE_WIDTH - MARGIN_X,
        y: cursorY + 3,
      },
      thickness: 0.6,
      color: rgb(0.75, 0.75, 0.75),
    });

    cursorY -= 7;
  }

  function drawLine(line: TailoredResumeLine) {
    const text = cleanText(line.text);

    switch (line.type) {
      case "spacer":
        cursorY -= 5;
        return;

      case "contact":
        drawWrapped(text, {
          size: 9,
          lineHeight: 12,
          spacingAfter: 4,
        });
        return;

      case "subheading":
        drawWrapped(text, {
          font: boldFont,
          size: SUBHEADING_SIZE,
          lineHeight: 14,
          spacingAfter: 2,
        });
        return;

      case "bullet":
        drawBullet(text);
        return;

      case "paragraph":
      case "text":
      default:
        drawWrapped(text, {
          size: BODY_SIZE,
          lineHeight: BODY_LINE_HEIGHT,
          spacingAfter: 2,
        });
    }
  }

  /*

* Header
*
* The first meaningful line of the first section is treated
* as the candidate name. This prevents the name from being
* rendered twice in the body.
  */
  const firstSection: TailoredResumeSection | undefined = resume.sections?.[0];

  const titleLine = firstSection?.lines?.find((line) => cleanText(line.text));

  const title = cleanText(titleLine?.text) || "Resume";

  const titleLines = wrapText(title, boldFont, NAME_SIZE, contentWidth);

  for (const line of titleLines) {
    ensureSpace(NAME_LINE_HEIGHT);

    page.drawText(line, {
      x: MARGIN_X,
      y: cursorY,
      size: NAME_SIZE,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    cursorY -= NAME_LINE_HEIGHT;
  }

  cursorY -= 2;

  /*

* Remaining sections
  */
  for (const section of resume.sections ?? []) {
    drawSectionHeading(section.heading);

    for (const line of section.lines ?? []) {
      if (section === firstSection && line === titleLine) {
        continue;
      }

      drawLine(line);
    }

    cursorY -= 4;
  }

  const pdfBytes = await pdfDoc.save();

  return new Uint8Array(pdfBytes);
}

export async function exportResume(
  acceptedResume: TailoredResume | null
): Promise<{
  buffer: Uint8Array;
  filename: string;
  mime: string;
} | null> {
  if (!acceptedResume) {
    return null;
  }

  const buffer = await createPdfBuffer(acceptedResume);

  return {
    buffer,
    filename: "tailored-resume.pdf",
    mime: "application/pdf",
  };
}
