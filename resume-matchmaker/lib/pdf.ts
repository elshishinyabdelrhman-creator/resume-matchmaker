/**
 * Server-only PDF utilities (Node). `pdf-parse` is listed in `next.config` `serverExternalPackages`.
 *
 * Note: `pdf-parse` v2 exposes `PDFParse`, not a default `pdf(buffer)` function. Extraction below
 * matches that API and applies the same cleanup you’d use after `data.text` in v1.
 */
import { PDFParse } from "pdf-parse";

/** Normalize newlines and strip common PDF text-layer artifacts. */
export function cleanExtractedPdfText(raw: string): string {
  return raw
    .replace(/\n\s*\n/g, "\n\n")
    .replace(/\f/g, "\n")
    .trim();
}

/**
 * Extract plain text from a PDF `File` (e.g. from a Server Action upload).
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return extractTextFromPdfBuffer(buffer);
}

/**
 * Extract plain text from a PDF buffer. Returns empty string if no text layer is found.
 * Always destroys the parser in a `finally` block to release native handles.
 */
export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const text = result.text?.trim() ?? "";
    return cleanExtractedPdfText(text);
  } finally {
    await parser.destroy();
  }
}
