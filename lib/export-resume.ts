import { Document, Packer, Paragraph, TextRun } from "docx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  TailoredResume,
  TailoredResumeSection,
  TailoredResumeLine,
} from "@/types/analysis";

function createTxtBuffer(resume: TailoredResume): Uint8Array {
  return new Uint8Array(Buffer.from(resume.full_text || "", "utf-8"));
}

async function createDocxBuffer(resume: TailoredResume): Promise<Uint8Array> {
  const children: Paragraph[] = [];

  function pushLine(line: TailoredResumeLine) {
    const text = line.text || "";

    switch (line.type) {
      case "spacer":
        children.push(new Paragraph(""));
        return;

      case "subheading":
        children.push(
          new Paragraph({
            spacing: {
              before: 160,
              after: 80,
            },
            children: [
              new TextRun({
                text,
                bold: true,
              }),
            ],
          })
        );
        return;

      case "bullet":
        children.push(
          new Paragraph({
            text,
            bullet: {
              level: line.indent ?? 0,
            },
          }) as any
        );
        return;

      default:
        children.push(
          new Paragraph({
            children: [new TextRun(text)],
          })
        );
    }
  }

  resume.sections.forEach((section: TailoredResumeSection) => {
    children.push(
      new Paragraph({
        spacing: {
          before: 240,
          after: 120,
        },
        children: [
          new TextRun({
            text: section.heading.toUpperCase(),
            bold: true,
          }),
        ],
      })
    );

    section.lines.forEach(pushLine);
  });

  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            size: 28,
            bold: true,
          },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            size: 20,
            bold: true,
          },
        },
      ],
    },
    sections: [
      {
        children,
      },
    ],
  });

  return new Uint8Array(await Packer.toBuffer(doc));
}

async function createPdfBuffer(resume: TailoredResume): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  const normalFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  const bodySize = 12;
  const headingSize = 14;
  const titleSize = 20;
  const lineHeight = 18;

  let page = pdfDoc.addPage();
  let cursorY = page.getHeight() - margin;

  function ensurePage() {
    if (cursorY < margin + lineHeight) {
      page = pdfDoc.addPage();
      cursorY = page.getHeight() - margin;
    }
  }

  function wrapText(
    text: string,
    font: typeof normalFont,
    fontSize: number,
    maxWidth: number
  ) {
    if (!text) return [""];

    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = "";

    for (const word of words) {
      const test = current ? `${current} ${word}` : word;

      if (font.widthOfTextAtSize(test, fontSize) <= maxWidth) {
        current = test;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }

    if (current) lines.push(current);

    return lines;
  }

  function drawLines(
    lines: string[],
    options?: {
      fontSize?: number;
      bold?: boolean;
      indent?: number;
    }
  ) {
    const fontSize = options?.fontSize ?? bodySize;
    const indent = options?.indent ?? 0;
    const font = options?.bold ? boldFont : normalFont;

    for (const line of lines) {
      ensurePage();

      page.drawText(line, {
        x: margin + indent,
        y: cursorY,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });

      cursorY -= lineHeight;
    }
  }

  // Title
  const title =
    resume.sections[0]?.lines[0]?.text?.trim() ||
    resume.sections[0]?.heading ||
    "Resume";

  drawLines(
    wrapText(title, boldFont, titleSize, page.getWidth() - margin * 2),
    {
      fontSize: titleSize,
      bold: true,
    }
  );

  cursorY -= 10;

  for (const section of resume.sections) {
    // Section Heading
    drawLines(
      wrapText(
        section.heading.toUpperCase(),
        boldFont,
        headingSize,
        page.getWidth() - margin * 2
      ),
      {
        fontSize: headingSize,
        bold: true,
      }
    );

    cursorY -= 4;

    for (const line of section.lines) {
      switch (line.type) {
        case "spacer":
          cursorY -= lineHeight / 2;
          break;

        case "subheading":
          drawLines(
            wrapText(
              line.text,
              boldFont,
              bodySize,
              page.getWidth() - margin * 2
            ),
            {
              bold: true,
            }
          );
          break;

        case "bullet": {
          const indent = (line.indent ?? 0) * 15;
          const bullet = `• ${line.text}`;

          drawLines(
            wrapText(
              bullet,
              normalFont,
              bodySize,
              page.getWidth() - margin * 2 - indent
            ),
            {
              indent,
            }
          );

          break;
        }

        default:
          drawLines(
            wrapText(
              line.text,
              normalFont,
              bodySize,
              page.getWidth() - margin * 2
            )
          );
      }
    }

    cursorY -= lineHeight / 2;
  }

  const pdfBytes = await pdfDoc.save();
  return new Uint8Array(pdfBytes);
}

export type ExportFormat = "pdf" | "docx" | "txt";

export async function exportResume(
  acceptedResume: TailoredResume | null,
  format: ExportFormat = "pdf"
): Promise<{
  buffer: Uint8Array;
  filename: string;
  mime: string;
} | null> {
  if (!acceptedResume) return null;

  const baseName = "resume";

  switch (format) {
    case "txt":
      return {
        buffer: createTxtBuffer(acceptedResume),
        filename: `${baseName}.txt`,
        mime: "text/plain",
      };

    case "docx":
      return {
        buffer: await createDocxBuffer(acceptedResume),
        filename: `${baseName}.docx`,
        mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      };

    case "pdf":
    default:
      return {
        buffer: await createPdfBuffer(acceptedResume),
        filename: `${baseName}.pdf`,
        mime: "application/pdf",
      };
  }
}
