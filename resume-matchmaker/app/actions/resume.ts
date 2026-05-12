"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { extractResumeText } from "@/lib/resume/parse";
import { extractStructuredResume } from "@/lib/resume/structure";
import type { ResumeStructured } from "@/lib/resume/types";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const uploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((f) => f.size > 0 && f.size < 8_000_000, "File must be under 8MB."),
});

export type ResumePreviewPayload = {
  resumeId: string;
  fileName: string;
  excerpt: string;
  wordCount: number;
  structured: ResumeStructured;
};

export type ResumeUploadState = {
  ok?: boolean;
  error?: string;
  preview?: ResumePreviewPayload;
};

function resolveResumeKind(file: File): { kind: "pdf" | "docx" | "txt" | null; contentType: string } {
  const name = file.name.toLowerCase();
  const type = file.type;

  if (name.endsWith(".pdf") || type === "application/pdf") {
    return { kind: "pdf", contentType: "application/pdf" };
  }
  if (name.endsWith(".docx") || type === DOCX_MIME) {
    return { kind: "docx", contentType: DOCX_MIME };
  }
  if (name.endsWith(".txt") || type === "text/plain") {
    return { kind: "txt", contentType: "text/plain" };
  }

  return { kind: null, contentType: type || "application/octet-stream" };
}

export async function uploadResume(
  _prev: ResumeUploadState | undefined,
  formData: FormData,
): Promise<ResumeUploadState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You need to sign in to upload a resume." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "Choose a PDF or Word document." };
  }

  const parsedFile = uploadSchema.safeParse({ file });
  if (!parsedFile.success) {
    return { error: parsedFile.error.issues[0]?.message ?? "Invalid file." };
  }

  const { kind, contentType } = resolveResumeKind(file);
  if (!kind) {
    return { error: "Use a PDF (.pdf) or Word (.docx) file." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsedText = await extractResumeText(buffer, contentType, file.name);
  const structured = await extractStructuredResume(parsedText);

  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 180);
  const objectPath = `${user.id}/${randomUUID()}-${safeName}`;

  const { error: storageError } = await supabase.storage.from("resumes").upload(objectPath, buffer, {
    contentType,
    upsert: false,
  });

  if (storageError) {
    return { error: storageError.message };
  }

  const { data: row, error: insertError } = await supabase
    .from("resumes")
    .insert({
      user_id: user.id,
      storage_path: objectPath,
      file_name: file.name,
      mime_type: contentType,
      parsed_text: parsedText || null,
      structured_data: structured,
    })
    .select("id")
    .single();

  if (insertError || !row) {
    return { error: insertError?.message ?? "Could not save resume metadata." };
  }

  revalidatePath("/resume");
  revalidatePath("/dashboard");

  const words = parsedText.split(/\s+/).filter(Boolean).length;
  const excerpt = parsedText.length > 6_000 ? `${parsedText.slice(0, 6_000).trim()}…` : parsedText;

  return {
    ok: true,
    preview: {
      resumeId: row.id,
      fileName: file.name,
      excerpt,
      wordCount: words,
      structured,
    },
  };
}
