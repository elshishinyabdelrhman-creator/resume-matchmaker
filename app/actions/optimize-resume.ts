"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

import { tailorResume } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function stringField(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

function optionalResumeId(formData: FormData): string | undefined {
  const v = formData.get("resumeId");
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  if (!t) return undefined;
  return UUID_RE.test(t) ? t : undefined;
}

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
 * Tailors resume vs JD, saves a `resumes` row when needed, inserts `applications` + `tailor_runs`.
 * Returns a discriminated union (no throws) so the client can toast without a second try/catch.
 */
export async function optimizeResume(formData: FormData): Promise<OptimizeResumeResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Please sign in first" };
    }

    const resumeText = stringField(formData, "resumeText");
    const company = stringField(formData, "company");
    const jobTitle = stringField(formData, "jobTitle");
    const jobDescription = stringField(formData, "jobDescription");
    const optionalResumeIdValue = optionalResumeId(formData);

    if (!resumeText.trim() || resumeText.trim().length < 50) {
      return { success: false, error: "Resume text is too short" };
    }
    if (!company.trim()) {
      return { success: false, error: "Company name is required" };
    }
    if (!jobTitle.trim()) {
      return { success: false, error: "Job title is required" };
    }
    if (!jobDescription.trim()) {
      return { success: false, error: "Job description is required" };
    }
    if (jobDescription.trim().length < 50) {
      return {
        success: false,
        error: "Job description is too short (minimum 50 characters).",
      };
    }

    console.log("Starting AI optimization...");

    const optimized = await tailorResume(
      resumeText.trim(),
      jobDescription.trim(),
      company.trim(),
      jobTitle.trim(),
    );

    let resolvedResumeId = optionalResumeIdValue;

    if (!resolvedResumeId) {
      const label = `${company.trim()} - ${jobTitle.trim()}`
        .replace(/[^\w.\-]+/g, "_")
        .slice(0, 180);
      const storagePath = `${user.id}/optimize-${randomUUID()}.txt`;

      const { data: resumeRow, error: resumeError } = await supabase
        .from("resumes")
        .insert({
          user_id: user.id,
          storage_path: storagePath,
          file_name: label || "optimized-resume.txt",
          mime_type: "text/plain",
          parsed_text: resumeText.trim(),
          structured_data: {},
        })
        .select("id")
        .single();

      if (resumeError || !resumeRow) {
        console.error("optimizeResume resume insert:", resumeError);
        return {
          success: false,
          error: resumeError?.message ?? "Could not save resume.",
        };
      }

      resolvedResumeId = resumeRow.id;
    }

    const trimmedCompany = company.trim();
    const trimmedTitle = jobTitle.trim();
    const trimmedJd = jobDescription.trim();

    const { data: application, error: appError } = await supabase
      .from("applications")
      .insert({
        user_id: user.id,
        job_id: null,
        company: trimmedCompany,
        role_title: trimmedTitle,
        job_title: trimmedTitle,
        job_description: trimmedJd,
        tailored_resume: optimized.tailoredResume,
        ats_score: optimized.atsScore,
        keyword_gaps: optimized.keywordGaps ?? [],
        strengths: optimized.strengths ?? [],
        improvements: optimized.improvements ?? [],
        source_url: null,
        resume_id: resolvedResumeId,
        status: "tailored",
        notes: null,
      })
      .select()
      .single();

    if (appError || !application) {
      console.error("optimizeResume application insert:", appError);
      return {
        success: false,
        error: appError?.message ?? "Could not save application.",
      };
    }

    const { data: runRow } = await supabase
      .from("tailor_runs")
      .insert({
        user_id: user.id,
        application_id: application.id,
        resume_id: resolvedResumeId,
        input_jd_excerpt: trimmedJd.slice(0, 2000),
        model: "Groq Llama 3.3 70B",
        suggestions: {
          kind: "optimize_resume",
          tailoredResumeMarkdown: optimized.tailoredResume,
          companyName: trimmedCompany,
          jobTitle: trimmedTitle,
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
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to tailor resume. Please try again.";
    console.error("🚨 Optimize Error:", error);
    return { success: false, error: message };
  }
}
