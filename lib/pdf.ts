/**
 * Server-side PDF text extraction via pdf.js (text layer).
 * `pdfjs-dist` is listed in `next.config` `serverExternalPackages`.
 *
 * Worker URL must match the installed `pdfjs-dist` version (a fixed CDN like 4.0.379 will
 * break against v5). We resolve `build/pdf.worker.mjs` from the package on disk.
 */
import * as pdfjsLib from "pdfjs-dist";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const pdfjsPackageDir = path.dirname(require.resolve("pdfjs-dist/package.json"));
pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(
  path.join(pdfjsPackageDir, "build", "pdf.worker.mjs"),
).href;

function normalizeExtractedText(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .replace(/\n+/g, "\n")
    .trim();
}

async function extractTextFromSource(data: ArrayBuffer | Uint8Array): Promise<string> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const loadingTask = pdfjsLib.getDocument({
    data: bytes,
    useSystemFonts: true,
    disableFontFace: true,
  });

  try {
    const pdf = await loadingTask.promise;

    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .filter(Boolean)
        .join(" ");
      fullText += pageText + "\n\n";
    }

    const cleanedText = normalizeExtractedText(fullText);

    if (cleanedText.length < 50) {
      throw new Error("Could not extract meaningful text from this PDF");
    }

    return cleanedText;
  } finally {
    await loadingTask.destroy();
  }
}

/**
 * Extract plain text from a PDF buffer.
 */
export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  try {
    return await extractTextFromSource(new Uint8Array(buffer));
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error("Failed to read PDF. Please paste text manually.");
  }
}

/**
 * Extract plain text from a PDF `File` (e.g. from a Server Action upload).
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    return await extractTextFromSource(arrayBuffer);
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error("Failed to read PDF. Please paste text manually.");
  }
}
