"use server";

import { extractTextFromPDF } from "@/lib/pdf";

export type ExtractPdfTextResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

/**
 * Parse PDF text on the server (pdf.js text layer). Call from client via FormData with `file`.
 */
export async function extractTextFromPDFAction(
  formData: FormData,
): Promise<ExtractPdfTextResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No file selected." };
  }

  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    return { ok: false, error: "Please upload a PDF file." };
  }

  try {
    const text = await extractTextFromPDF(file);
    const trimmed = text.trim();
    if (!trimmed || trimmed.length < 50) {
      return {
        ok: false,
        error:
          "Could not extract text from this PDF. Try copying and pasting manually.",
      };
    }
    return { ok: true, text };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to parse PDF.";
    return { ok: false, error: message };
  }
}
