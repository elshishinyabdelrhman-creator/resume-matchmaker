"use server";

import { generateObject } from "ai";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { buildJobMatchTailoringPrompt } from "@/lib/ai-prompts";
import { jobMatchResultSchema, type JobMatchResult } from "@/lib/ai/job-match-schema";
import { getTailoringModel } from "@/lib/ai/server-model";
import { createClient } from "@/lib/supabase/server";

const formSchema = z.object({
  companyName: z.string().min(1).max(200),
  jobTitle: z.string().min(1).max(200),
  jobDescription: z.string().min(80).max(40_000),
  resumeId: z.string().uuid(),
});

export type JobMatchActionState = {
  error?: string;
  result?: {
    tailorRunId: string;
    originalResume: string;
    structured: JobMatchResult;
    modelLabel: string;
    companyName: string;
    jobTitle: string;
  };
};

export async function runJobMatchTailoring(
  _prev: JobMatchActionState | undefined,
  formData: FormData,
): Promise<JobMatchActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sign in to tailor your resume." };
  }

  const parsed = formSchema.safeParse({
    companyName: formData.get("companyName"),
    jobTitle: formData.get("jobTitle"),
    jobDescription: formData.get("jobDescription"),
    resumeId: formData.get("resumeId"),
  });
  if (!parsed.success) {
    return {
      error: "Fill in company, job title, a detailed job description (80+ chars), and pick a resume.",
    };
  }

  const tailoring = getTailoringModel();
  if (!tailoring) {
    return {
      error: "Add ANTHROPIC_API_KEY (Claude) or GROQ_API_KEY (Llama 3.3 70B) to enable tailoring.",
    };
  }

  const { data: resume, error: resumeError } = await supabase
    .from("resumes")
    .select("id, parsed_text")
    .eq("id", parsed.data.resumeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (resumeError || !resume?.parsed_text || resume.parsed_text.trim().length < 40) {
    return { error: "Selected resume is missing parsed text. Re-upload the file." };
  }

  const resumeText = resume.parsed_text.trim().slice(0, 16_000);
  const jd = parsed.data.jobDescription.trim().slice(0, 14_000);

  const prompt = buildJobMatchTailoringPrompt({
    companyName: parsed.data.companyName,
    jobTitle: parsed.data.jobTitle,
    jobDescription: jd,
    resumeText,
  });

  let structured: JobMatchResult;
  try {
    const { object } = await generateObject({
      model: tailoring.model,
      schema: jobMatchResultSchema,
      prompt,
      maxOutputTokens: 10_000,
    });
    structured = object;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Model request failed.";
    return { error: message };
  }

  const { data: runRow, error: runErr } = await supabase
    .from("tailor_runs")
    .insert({
      user_id: user.id,
      resume_id: resume.id,
      application_id: null,
      input_jd_excerpt: jd.slice(0, 2000),
      model: tailoring.label,
      suggestions: {
        kind: "job_match",
        companyName: parsed.data.companyName,
        jobTitle: parsed.data.jobTitle,
        structured,
        tailoredResumeMarkdown: structured.tailoredResumeMarkdown,
      },
    })
    .select("id")
    .single();

  if (runErr || !runRow) {
    return { error: runErr?.message ?? "Could not save tailoring run." };
  }

  revalidatePath("/match");
  revalidatePath("/tailor");

  return {
    result: {
      tailorRunId: runRow.id,
      originalResume: resume.parsed_text,
      structured,
      modelLabel: tailoring.label,
      companyName: parsed.data.companyName,
      jobTitle: parsed.data.jobTitle,
    },
  };
}
