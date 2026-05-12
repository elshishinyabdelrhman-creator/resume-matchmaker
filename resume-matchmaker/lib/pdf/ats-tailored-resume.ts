import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import { markdownToAtsPlainText } from "@/lib/pdf/markdown-to-plain";

/** Standard fonts only support WinAnsi; map other chars to safe substitutes. */
function toWinAnsiLine(text: string): string {
  let out = "";
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    out += code < 256 ? ch : " ";
  }
  return out;
}

function wrapLine(text: string, font: { widthOfTextAtSize: (t: string, s: number) => number }, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let current = "";

  for (const w of words) {
    const next = current ? `${current} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      if (font.widthOfTextAtSize(w, size) <= maxWidth) {
        current = w;
      } else {
        let chunk = w;
        while (chunk.length > 0) {
          let cut = chunk.length;
          while (cut > 1 && font.widthOfTextAtSize(chunk.slice(0, cut), size) > maxWidth) {
            cut -= 1;
          }
          lines.push(chunk.slice(0, cut));
          chunk = chunk.slice(cut);
        }
        current = "";
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Single-column, Helvetica PDF optimized for ATS parsers (embedded text, no images).
 */
export async function buildAtsTailoredResumePdf(markdown: string, documentTitle: string): Promise<Uint8Array> {
  const body = markdownToAtsPlainText(markdown);
  const pdf = await PDFDocument.create();
  pdf.setTitle(documentTitle.slice(0, 120));
  pdf.setAuthor("Resume Matchmaker");

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 54;
  const maxWidth = pageWidth - margin * 2;
  const bodySize = 11;
  const titleSize = 14;
  const lineHeight = 14;
  const paraGap = 6;

  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  page.drawText(toWinAnsiLine(documentTitle.slice(0, 200)), {
    x: margin,
    y: y - titleSize,
    size: titleSize,
    font: fontBold,
    color: rgb(0.08, 0.08, 0.08),
  });
  y -= titleSize + paraGap * 2;

  const paragraphs = body.split(/\n\n+/);

  for (const para of paragraphs) {
    const lines = para.split("\n").flatMap((line) =>
      wrapLine(toWinAnsiLine(line.trim()), font, bodySize, maxWidth),
    );

    for (const line of lines) {
      if (!line) {
        y -= paraGap;
        continue;
      }

      if (!line.trim()) {
        y -= paraGap;
        continue;
      }

      const shortHeading =
        line.length > 0 &&
        line.length < 48 &&
        line === line.toUpperCase() &&
        /[A-Z]/.test(line);
      const useBold = shortHeading && !line.startsWith("•");
      const activeFont = useBold ? fontBold : font;
      const size = useBold ? 11.5 : bodySize;

      if (y < margin + lineHeight + 20) {
        page = pdf.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }

      page.drawText(line, {
        x: margin,
        y: y - size,
        size,
        font: activeFont,
        color: rgb(0.12, 0.12, 0.12),
      });
      y -= lineHeight;
    }

    y -= paraGap;
  }

  return pdf.save();
}
