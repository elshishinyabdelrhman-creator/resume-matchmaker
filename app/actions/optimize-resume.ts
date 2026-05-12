"use server";

import { tailorResume } from "@/lib/ai";

export type OptimizeResumeResult = {
  success: true;
  tailoredResume: string;
  atsScore: number;
  keywordGaps: string[];
  strengths: string[];
  improvements: string[];
};

function field(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

export async function optimizeResume(
  formData: FormData,
): Promise<OptimizeResumeResult> {
  try {
    const resumeText = field(formData, "resumeText");
    const company = field(formData, "company");
    const jobTitle = field(formData, "jobTitle");
    const jobDescription = field(formData, "jobDescription");

    if (!resumeText.trim() || resumeText.trim().length < 50) {
      throw new Error("Resume text is too short");
    }
    if (!company.trim()) throw new Error("Company is required");
    if (!jobTitle.trim()) throw new Error("Job title is required");
    if (!jobDescription.trim()) throw new Error("Job description is required");

    const optimized = await tailorResume(
      resumeText.trim(),
      jobDescription.trim(),
      company.trim(),
      jobTitle.trim(),
    );

    return {
      success: true,
      tailoredResume: optimized.tailoredResume,
      atsScore: optimized.atsScore,
      keywordGaps: optimized.keywordGaps ?? [],
      strengths: optimized.strengths ?? [],
      improvements: optimized.improvements ?? [],
    };
  } catch (error: unknown) {
    console.error("Action Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to optimize resume";
    throw new Error(message);
  }
}
