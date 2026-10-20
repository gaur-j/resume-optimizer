import type {
  TailoredResume,
  TailoredResumeLine,
  TailoredResumeLineType,
  TailoredResumeSection,
} from "@/types/analysis";
import {
  MAX_EXPORT_HEADING_CHARS,
  MAX_EXPORT_LINE_CHARS,
  MAX_EXPORT_LINES,
  MAX_EXPORT_SECTIONS,
  MAX_EXPORT_TOTAL_CHARS,
} from "@/lib/limits";

/**
 * /api/export receives a resume as JSON from the browser, so it is untrusted:
 * anyone signed in can post anything. This reduces it to exactly what the PDF
 * renderer reads (section headings; line type / text / indent), drops every
 * other key, and enforces size ceilings so one request can't make the server
 * lay out an arbitrarily large document.
 */
export class ExportValidationError extends Error {
  constructor(message: string, public readonly kind: "invalid" | "too_large") {
    super(message);
    this.name = "ExportValidationError";
  }
}

const LINE_TYPES: readonly TailoredResumeLineType[] = [
  "contact",
  "subheading",
  "paragraph",
  "bullet",
  "text",
  "spacer",
];

const MAX_INDENT = 6;

function tooLarge(message: string): never {
  throw new ExportValidationError(message, "too_large");
}

function invalid(message: string): never {
  throw new ExportValidationError(message, "invalid");
}

export function validateExportResume(raw: unknown): TailoredResume {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    invalid("Resume data is invalid.");
  }

  const sectionsRaw = (raw as { sections?: unknown }).sections;
  if (!Array.isArray(sectionsRaw) || sectionsRaw.length === 0) {
    invalid("Resume data is invalid.");
  }
  if (sectionsRaw.length > MAX_EXPORT_SECTIONS) {
    tooLarge("This resume has too many sections to export.");
  }

  let totalLines = 0;
  let totalChars = 0;

  const sections: TailoredResumeSection[] = sectionsRaw.map(
    (sectionRaw, sectionIndex) => {
      if (typeof sectionRaw !== "object" || sectionRaw === null) {
        invalid("Resume data is invalid.");
      }
      const section = sectionRaw as {
        heading?: unknown;
        order?: unknown;
        lines?: unknown;
      };

      const heading =
        typeof section.heading === "string" ? section.heading : "";
      if (heading.length > MAX_EXPORT_HEADING_CHARS) {
        tooLarge("A section heading is too long to export.");
      }
      totalChars += heading.length;

      const linesRaw = section.lines === undefined ? [] : section.lines;
      if (!Array.isArray(linesRaw)) invalid("Resume data is invalid.");

      totalLines += linesRaw.length;
      if (totalLines > MAX_EXPORT_LINES) {
        tooLarge("This resume has too many lines to export.");
      }

      const lines: TailoredResumeLine[] = linesRaw.map((lineRaw, lineIndex) => {
        if (typeof lineRaw !== "object" || lineRaw === null) {
          invalid("Resume data is invalid.");
        }
        const line = lineRaw as {
          type?: unknown;
          text?: unknown;
          order?: unknown;
          indent?: unknown;
        };

        const text = typeof line.text === "string" ? line.text : "";
        if (text.length > MAX_EXPORT_LINE_CHARS) {
          tooLarge("A line of your resume is too long to export.");
        }
        totalChars += text.length;
        if (totalChars > MAX_EXPORT_TOTAL_CHARS) {
          tooLarge("This resume is too long to export.");
        }

        const type = LINE_TYPES.includes(line.type as TailoredResumeLineType)
          ? (line.type as TailoredResumeLineType)
          : "text";

        const indent =
          typeof line.indent === "number" &&
          Number.isInteger(line.indent) &&
          line.indent >= 0 &&
          line.indent <= MAX_INDENT
            ? line.indent
            : 0;

        return {
          type,
          text,
          order:
            typeof line.order === "number" && Number.isFinite(line.order)
              ? line.order
              : lineIndex,
          indent,
        };
      });

      return {
        heading,
        order:
          typeof section.order === "number" && Number.isFinite(section.order)
            ? section.order
            : sectionIndex,
        lines,
      };
    }
  );

  // The renderer only reads `sections`; the other TailoredResume fields are
  // filled with neutral values so the type is satisfied.
  return {
    sections,
    full_text: "",
    keywords_added: [],
    keywords_matched: [],
    keywords_missing: [],
    changes_summary: {
      bullets_rewritten: 0,
      summary_updated: false,
      skills_updated: false,
    },
  };
}
