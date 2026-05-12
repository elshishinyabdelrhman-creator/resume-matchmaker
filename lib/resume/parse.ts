import mammoth from "mammoth";

import { extractTextFromPdfBuffer } from "@/lib/pdf";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * Server-only text extraction for supported resume formats.
 */
export async function extractResumeText(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<string> {
  const lowerName = fileName.toLowerCase();

  if (mimeType === "application/pdf" || lowerName.endsWith(".pdf")) {
    return extractTextFromPdfBuffer(buffer);
  }

  if (mimeType === DOCX_MIME || lowerName.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return (result.value ?? "").trim();
  }

  if (mimeType === "text/plain" || lowerName.endsWith(".txt")) {
    return buffer.toString("utf-8").trim();
  }

  return "";
}
