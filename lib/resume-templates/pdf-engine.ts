import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";
import type {
  TailoredResume,
  TailoredResumeLine,
  TailoredResumeSection,
} from "@/types/analysis";
import type { ResumeTemplateStyle } from "./types";

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

/**
 * pdf-lib's built-in standard fonts (Helvetica and Times families alike)
 * only support WinAnsiEncoding (roughly Windows-1252 / Latin-1) — NOT full
 * Unicode. LLM output routinely contains typographic punctuation outside
 * that set (a non-breaking hyphen "‑" U+2011 is what actually crashed this
 * export originally; smart quotes, ellipses, and zero-width characters are
 * the same class of risk). Rather than maintaining a growing blocklist of
 * "characters that broke it last time", this normalizes the common cases
 * to safe ASCII (which also happens to be more ATS-friendly than fancy
 * typography) and strips anything else outside Latin-1 as a catch-all, so
 * a character we haven't seen yet can't crash the export again.
 */
function sanitizeForPdf(value: string): string {
  return (
    value
      // Hyphen/dash variants -> plain ASCII hyphen.
      .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, "-")
      // Smart single quotes/apostrophes -> straight quote
      .replace(/[\u2018\u2019\u201A\u2032]/g, "'")
      // Smart double quotes -> straight quote
      .replace(/[\u201C\u201D\u201E\u2033]/g, '"')
      // Ellipsis
      .replace(/\u2026/g, "...")
      // Zero-width characters / BOM have no visual representation anyway
      .replace(/[\u200B\u200C\u200D\uFEFF]/g, "")
      // Catch-all: anything else outside Latin-1 (WinAnsi/CP1252's range)
      // gets dropped rather than crashing the whole export.
      .replace(/[^\u0000-\u00FF]/g, "")
  );
}

export function cleanText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return sanitizeForPdf(
    value
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\u0000/g, "")
  ).trim();
}

function wrapText(
  text: string,
  font: PDFFont,
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

const BLACK = rgb(0, 0, 0);
const DIVIDER_GREY: [number, number, number] = [0.75, 0.75, 0.75];

/**
 * Owns page/cursor state for one PDF export and exposes style-aware
 * drawing primitives. Every template (registry.ts) renders through the
 * same instance of this class, parametrized by a ResumeTemplateStyle —
 * this is what lets a new template be "a new style config", not a new
 * renderer with its own copy of the pagination/wrapping logic.
 */
export class PdfLayoutEngine {
  private pdfDoc: PDFDocument;
  private style: ResumeTemplateStyle;
  private regularFont: PDFFont;
  private boldFont: PDFFont;
  private page: ReturnType<PDFDocument["addPage"]>;
  private cursorY: number;
  private readonly contentWidth = PAGE_WIDTH - MARGIN_X * 2;

  private constructor(
    pdfDoc: PDFDocument,
    style: ResumeTemplateStyle,
    regularFont: PDFFont,
    boldFont: PDFFont
  ) {
    this.pdfDoc = pdfDoc;
    this.style = style;
    this.regularFont = regularFont;
    this.boldFont = boldFont;
    this.page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.cursorY = PAGE_HEIGHT - MARGIN_TOP;
  }

  static async create(
    pdfDoc: PDFDocument,
    style: ResumeTemplateStyle
  ): Promise<PdfLayoutEngine> {
    const [regular, bold] =
      style.font === "times"
        ? [StandardFonts.TimesRoman, StandardFonts.TimesRomanBold]
        : [StandardFonts.Helvetica, StandardFonts.HelveticaBold];

    const regularFont = await pdfDoc.embedFont(regular);
    const boldFont = await pdfDoc.embedFont(bold);

    return new PdfLayoutEngine(pdfDoc, style, regularFont, boldFont);
  }

  private scale(value: number): number {
    return value * this.style.spacingScale;
  }

  private accentColorOrBlack() {
    return this.style.accentColor ? rgb(...this.style.accentColor) : BLACK;
  }

  private addPage() {
    this.page = this.pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.cursorY = PAGE_HEIGHT - MARGIN_TOP;
  }

  private ensureSpace(height: number) {
    if (this.cursorY - height < MARGIN_BOTTOM) {
      this.addPage();
    }
  }

  private drawWrapped(
    text: string,
    options: {
      font?: PDFFont;
      size?: number;
      lineHeight?: number;
      indent?: number;
      spacingAfter?: number;
      color?: ReturnType<typeof rgb>;
    } = {}
  ) {
    const font = options.font ?? this.regularFont;
    const size = options.size ?? BODY_SIZE;
    const lineHeight = this.scale(options.lineHeight ?? BODY_LINE_HEIGHT);
    const indent = options.indent ?? 0;
    const spacingAfter = this.scale(options.spacingAfter ?? 0);
    const color = options.color ?? BLACK;
    const maxWidth = this.contentWidth - indent;

    const lines = wrapText(text, font, size, maxWidth);

    for (const line of lines) {
      if (!line) {
        this.cursorY -= lineHeight / 2;
        continue;
      }

      this.ensureSpace(lineHeight);

      this.page.drawText(line, {
        x: MARGIN_X + indent,
        y: this.cursorY,
        size,
        font,
        color,
      });

      this.cursorY -= lineHeight;
    }

    this.cursorY -= spacingAfter;
  }

  private drawBullet(text: string) {
    const indent = 14;

    const lines = wrapText(
      cleanText(text),
      this.regularFont,
      BODY_SIZE,
      this.contentWidth - indent
    );

    if (lines.length === 0) {
      return;
    }

    const lineHeight = this.scale(BODY_LINE_HEIGHT);

    for (let index = 0; index < lines.length; index++) {
      this.ensureSpace(lineHeight);

      if (index === 0) {
        this.page.drawText("•", {
          x: MARGIN_X,
          y: this.cursorY,
          size: BODY_SIZE,
          font: this.regularFont,
          color: BLACK,
        });
      }

      this.page.drawText(lines[index], {
        x: MARGIN_X + indent,
        y: this.cursorY,
        size: BODY_SIZE,
        font: this.regularFont,
        color: BLACK,
      });

      this.cursorY -= lineHeight;
    }

    this.cursorY -= this.scale(2);
  }

  private drawSectionHeading(heading: string) {
    const raw = cleanText(heading);
    if (!raw) return;

    const text = this.style.uppercaseHeadings ? raw.toUpperCase() : raw;
    const lineHeight = this.scale(SECTION_LINE_HEIGHT);

    this.ensureSpace(lineHeight + 10);
    this.cursorY -= this.scale(5);

    this.page.drawText(text, {
      x: MARGIN_X,
      y: this.cursorY,
      size: SECTION_SIZE,
      font: this.boldFont,
      color: this.accentColorOrBlack(),
    });

    this.cursorY -= lineHeight;

    if (this.style.showDividers) {
      // A thin divider gives structure without introducing graphics that
      // can hurt ATS readability. Uses the accent color when the template
      // has one, so the accent reads as a deliberate design choice rather
      // than being confined to text alone.
      this.page.drawLine({
        start: { x: MARGIN_X, y: this.cursorY + 3 },
        end: { x: PAGE_WIDTH - MARGIN_X, y: this.cursorY + 3 },
        thickness: 0.6,
        color: this.style.accentColor
          ? rgb(...this.style.accentColor)
          : rgb(...DIVIDER_GREY),
      });
    }

    this.cursorY -= this.scale(7);
  }

  private drawLine(line: TailoredResumeLine) {
    const text = cleanText(line.text);

    switch (line.type) {
      case "spacer":
        this.cursorY -= this.scale(5);
        return;

      case "contact":
        this.drawWrapped(text, { size: 9, lineHeight: 12, spacingAfter: 4 });
        return;

      case "subheading":
        this.drawWrapped(text, {
          font: this.boldFont,
          size: SUBHEADING_SIZE,
          lineHeight: 14,
          spacingAfter: 2,
        });
        return;

      case "bullet":
        this.drawBullet(text);
        return;

      case "paragraph":
      case "text":
      default:
        this.drawWrapped(text, {
          size: BODY_SIZE,
          lineHeight: BODY_LINE_HEIGHT,
          spacingAfter: 2,
        });
    }
  }

  /**
   * Renders a full resume: header (name + contact, from section 0's first
   * meaningful line and its siblings) followed by every remaining section.
   * This is the exact structure the original single-template export used —
   * unchanged here, just relocated so every template shares it.
   */
  renderResume(resume: TailoredResume) {
    const firstSection: TailoredResumeSection | undefined =
      resume.sections?.[0];
    const titleLine = firstSection?.lines?.find((line) =>
      cleanText(line.text)
    );
    const title = cleanText(titleLine?.text) || "Resume";

    const nameLineHeight = this.scale(NAME_LINE_HEIGHT);
    const titleLines = wrapText(
      title,
      this.boldFont,
      NAME_SIZE,
      this.contentWidth
    );

    for (const line of titleLines) {
      this.ensureSpace(nameLineHeight);

      this.page.drawText(line, {
        x: MARGIN_X,
        y: this.cursorY,
        size: NAME_SIZE,
        font: this.boldFont,
        color: BLACK, // name stays black regardless of accent - readability/ATS first
      });

      this.cursorY -= nameLineHeight;
    }

    this.cursorY -= this.scale(2);

    for (const section of resume.sections ?? []) {
      this.drawSectionHeading(section.heading);

      for (const line of section.lines ?? []) {
        if (section === firstSection && line === titleLine) {
          continue;
        }
        this.drawLine(line);
      }

      this.cursorY -= this.scale(4);
    }
  }

  async save(): Promise<Uint8Array> {
    return new Uint8Array(await this.pdfDoc.save());
  }
}
