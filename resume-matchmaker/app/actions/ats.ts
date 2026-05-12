"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { simulateAtsMatch } from "@/lib/ats/score";

const schema = z.object({
  applicationId: z.string().uuid(),
});

export type AtsActionState = { error?: string; ok?: boolean };

export async function scoreApplicationAts(
  _prev: AtsActionState | undefined,
  formData: FormData,
): Promise<AtsActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sign in to run ATS scoring." };
  }

  const parsed = schema.safeParse({ applicationId: formData.get("applicationId") });
  if (!parsed.success) {
    return { error: "Missing application." };
  }

  const { data: app, error: appError } = await supabase
    .from("applications")
    .select("id, job_description, resume_id, user_id")
    .eq("id", parsed.data.applicationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (appError || !app) {
    return { error: "Application not found." };
  }

  if (!app.job_description || app.job_description.trim().length < 40) {
    return { error: "Add a fuller job description before scoring." };
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
    return { error: "Link a resume with parsed text (upload a PDF) first." };
  }

  const result = simulateAtsMatch(resumeText, app.job_description);

  const { error: insertError } = await supabase.from("ats_scores").insert({
    application_id: app.id,
    resume_id: app.resume_id,
    overall_score: result.overall,
    breakdown: {
      ...result.breakdown,
      matchedKeywords: result.matchedKeywords,
      missingKeywords: result.missingKeywords,
      suggestions: result.suggestions,
      improvementTips: result.improvementTips,
    },
  });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath(`/applications/${app.id}`);
  revalidatePath("/applications/board");
  revalidatePath("/applications/list");
  revalidatePath("/ats");
  return { ok: true };
}
