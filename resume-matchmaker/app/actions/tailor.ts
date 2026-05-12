"use server";

import { generateText } from "ai";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { buildApplicationTailorPrompt } from "@/lib/ai-prompts";
import { createClient } from "@/lib/supabase/server";
import { getLanguageModel } from "@/lib/ai/server-model";

const schema = z.object({
  applicationId: z.string().uuid(),
});

export type TailorActionState = { error?: string; ok?: boolean; summary?: string };

export async function tailorResumeToJob(
  _prev: TailorActionState | undefined,
  formData: FormData,
): Promise<TailorActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sign in to tailor your resume." };
  }

  const parsed = schema.safeParse({ applicationId: formData.get("applicationId") });
  if (!parsed.success) {
    return { error: "Missing application." };
  }

  const model = getLanguageModel();
  if (!model) {
    return { error: "Configure OPENAI_API_KEY or GROQ_API_KEY to enable AI tailoring." };
  }

  const { data: app, error: appError } = await supabase
    .from("applications")
    .select("id, job_description, resume_id, user_id, company, role_title")
    .eq("id", parsed.data.applicationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (appError || !app) {
    return { error: "Application not found." };
  }

  if (!app.job_description || app.job_description.trim().length < 40) {
    return { error: "Paste a complete job description first." };
  }

  let resumeText = "";
  if (app.resume_id) {
    const { data: resume } = await supabase
      .from("resumes")
      .select("parsed_text")
      .eq("id", app.resume_id)
      .eq("user_id", user.id)
      .maybeSingle();
    resumeText = resume?.parsed_text ?? "";
  }

  if (!resumeText) {
    return { error: "Link a resume with text (upload & parse) before tailoring." };
  }

  const prompt = buildApplicationTailorPrompt({
    company: app.company,
    roleTitle: app.role_title,
    jobDescription: app.job_description,
    resumeText,
  });

  const { text } = await generateText({
    model,
    prompt,
    maxOutputTokens: 900,
  });

  const { error: insertError } = await supabase.from("tailor_runs").insert({
    user_id: user.id,
    application_id: app.id,
    resume_id: app.resume_id,
    input_jd_excerpt: app.job_description.slice(0, 2000),
    suggestions: { markdown: text },
    model: "server",
  });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath(`/applications/${app.id}`);
  revalidatePath("/applications/board");
  revalidatePath("/applications/list");
  revalidatePath("/tailor");
  return { ok: true, summary: text };
}
