"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { simulateAtsMatch, type AtsSimulationResult } from "@/lib/ats/score";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  resumeId: z.string().uuid(),
  jobDescription: z.string().min(80).max(40_000),
});

export type AtsSimulatorState = {
  error?: string;
  result?: AtsSimulationResult & { resumeFileName: string };
};

export async function runAtsSimulator(
  _prev: AtsSimulatorState | undefined,
  formData: FormData,
): Promise<AtsSimulatorState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sign in to run the ATS simulator." };
  }

  const parsed = schema.safeParse({
    resumeId: formData.get("resumeId"),
    jobDescription: formData.get("jobDescription"),
  });
  if (!parsed.success) {
    return {
      error: "Pick a resume and paste a full job description (80+ characters).",
    };
  }

  const { data: resume, error: resumeError } = await supabase
    .from("resumes")
    .select("id, file_name, parsed_text")
    .eq("id", parsed.data.resumeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (resumeError || !resume?.parsed_text || resume.parsed_text.trim().length < 40) {
    return { error: "That resume has no parsed text yet. Re-upload or pick another file." };
  }

  const result = simulateAtsMatch(resume.parsed_text, parsed.data.jobDescription);

  const { error: insertError } = await supabase.from("ats_scores").insert({
    application_id: null,
    resume_id: resume.id,
    overall_score: result.overall,
    breakdown: {
      ...result.breakdown,
      matchedKeywords: result.matchedKeywords,
      missingKeywords: result.missingKeywords,
      suggestions: result.suggestions,
      improvementTips: result.improvementTips,
      source: "simulator",
    },
  });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath("/ats");
  revalidatePath("/applications/board");
  revalidatePath("/applications/list");

  return {
    result: {
      ...result,
      resumeFileName: resume.file_name,
    },
  };
}
