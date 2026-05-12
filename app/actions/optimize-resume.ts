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

export async function optimizeResume(
  formData: FormData,
): Promise<OptimizeResumeResult> {
  try {
    const resumeText = formData.get("resumeText") as string;
    const company = formData.get("company") as string;
    const jobTitle = formData.get("jobTitle") as string;
    const jobDescription = formData.get("jobDescription") as string;

    if (!resumeText || resumeText.trim().length < 50) {
      throw new Error("Resume text is too short. Please paste your resume.");
    }
    if (!company?.trim()) throw new Error("Company name is required");
    if (!jobTitle?.trim()) throw new Error("Job title is required");
    if (!jobDescription?.trim()) throw new Error("Job description is required");

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
      keywordGaps: optimized.keywordGaps || [],
      strengths: optimized.strengths || [],
      improvements: optimized.improvements || [],
    };
  } catch (error: unknown) {
    console.error("Server Action Error:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to generate tailored resume",
    );
  }
}
