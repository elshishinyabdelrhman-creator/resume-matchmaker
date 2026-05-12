"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { tailorResume } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

const optionalResumeId = z
  .string()
  .optional()
  .nullable()
  .transform((s) => {
    const t = (s ?? "").trim();
    return t.length > 0 ? t : undefined;
  })
  .refine((v) => v === undefined || z.string().uuid().safeParse(v).success, {
    message: "Invalid resume id",
  });

const formSchema = z.object({
  resumeText: z.string().min(40).max(20_000),
  jobDescription: z.string().min(40).max(40_000),
  company: z.string().min(1).max(200),
  jobTitle: z
    .string()
    .max(200)
    .optional()
    .nullable()
    .transform((s) => {
      const t = (s ?? "").trim();
      return t.length > 0 ? t : "Role";
    }),
  resumeId: optionalResumeId,
});

export type OptimizeResumeResult =
  | {
      success: true;
      application: Database["public"]["Tables"]["applications"]["Row"];
      tailorRunId: string | null;
      tailoredResume: string;
      atsScore: number;
      gaps: string[];
      strengths: string[];
      improvements: string[];
    }
  | { success: false; error: string };

/**
 * Tailors resume text vs JD, persists an application (no `jobs` row).
 * If `resumeId` is omitted, inserts an inline `resumes` row (synthetic storage path + `parsed_text`).
 */
export async function optimizeResume(formData: FormData): Promise<OptimizeResumeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = formSchema.safeParse({
    resumeText: formData.get("resumeText"),
    jobDescription: formData.get("jobDescription"),
    company: formData.get("company"),
    jobTitle: formData.get("jobTitle"),
    resumeId: formData.get("resumeId"),
  });

  if (!parsed.success) {
    return { success: false, error: "Missing or invalid fields." };
  }

  const { resumeText, jobDescription, company, jobTitle, resumeId } = parsed.data;

  let optimized;
  try {
    optimized = await tailorResume(resumeText, jobDescription, company, jobTitle);
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI request failed.";
    return { success: false, error: message };
  }

  let resolvedResumeId = resumeId;

  if (!resolvedResumeId) {
    const label = `${company} - ${jobTitle}`.replace(/[^\w.\-]+/g, "_").slice(0, 180);
    const storagePath = `${user.id}/optimize-${randomUUID()}.txt`;

    const { data: resumeRow, error: resumeError } = await supabase
      .from("resumes")
      .insert({
        user_id: user.id,
        storage_path: storagePath,
        file_name: label || "optimized-resume.txt",
        mime_type: "text/plain",
        parsed_text: resumeText,
        structured_data: {},
      })
      .select("id")
      .single();

    if (resumeError || !resumeRow) {
      return { success: false, error: resumeError?.message ?? "Could not save resume." };
    }

    resolvedResumeId = resumeRow.id;
  }

  const { data: application, error: appError } = await supabase
    .from("applications")
    .insert({
      user_id: user.id,
      job_id: null,
      company,
      role_title: jobTitle,
      job_title: jobTitle,
      job_description: jobDescription,
      tailored_resume: optimized.tailoredResume,
      ats_score: optimized.atsScore,
      keyword_gaps: optimized.keywordGaps,
      strengths: optimized.strengths,
      improvements: optimized.improvements,
      source_url: null,
      resume_id: resolvedResumeId,
      status: "tailored",
      notes: null,
    })
    .select()
    .single();

  if (appError || !application) {
    return { success: false, error: appError?.message ?? "Could not save application." };
  }

  const { data: runRow } = await supabase
    .from("tailor_runs")
    .insert({
      user_id: user.id,
      application_id: application.id,
      resume_id: resolvedResumeId,
      input_jd_excerpt: jobDescription.slice(0, 2000),
      model: "Groq Llama 3.3 70B",
      suggestions: {
        kind: "optimize_resume",
        tailoredResumeMarkdown: optimized.tailoredResume,
        companyName: company,
        jobTitle,
        strengths: optimized.strengths,
        improvements: optimized.improvements,
      },
    })
    .select("id")
    .single();

  const tailorRunId = runRow?.id ?? null;

  revalidatePath("/dashboard");
  revalidatePath("/applications/board");
  revalidatePath("/applications/list");
  revalidatePath(`/applications/${application.id}`);

  return {
    success: true,
    application,
    tailorRunId,
    tailoredResume: optimized.tailoredResume,
    atsScore: optimized.atsScore,
    gaps: optimized.keywordGaps,
    strengths: optimized.strengths,
    improvements: optimized.improvements,
  };
}
