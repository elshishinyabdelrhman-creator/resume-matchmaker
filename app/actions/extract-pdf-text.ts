"use server";

import { extractTextFromPDF } from "@/lib/pdf";

export type ExtractPdfTextResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

/**
 * Parse PDF text on the server (Buffer + pdf-parse). Call from client via FormData with `file`.
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
    if (!text.trim()) {
      return {
        ok: false,
        error: "No text found in this PDF. Try pasting your resume manually.",
      };
    }
    return { ok: true, text };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to parse PDF.";
    return { ok: false, error: message };
  }
}
