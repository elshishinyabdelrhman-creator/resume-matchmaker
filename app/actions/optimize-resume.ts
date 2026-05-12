"use server";

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

    if (!resumeText || resumeText.trim().length < 30) {
      throw new Error("Please paste your resume text");
    }
    if (!company?.trim()) throw new Error("Company is required");
    if (!jobTitle?.trim()) throw new Error("Job title is required");
    if (!jobDescription?.trim()) throw new Error("Job description is required");

    // Mock response - no AI, no PDF, no external calls
    const mockTailored = `# Professional Resume - ${jobTitle} at ${company}

## Professional Summary
Results-driven professional with strong experience matching the requirements in your job description.

## Key Achievements
• Successfully delivered projects that improved efficiency and performance
• Demonstrated expertise in key areas mentioned in the job posting
• Consistently exceeded targets and received positive feedback

## Skills
${jobDescription.split(" ").slice(0, 20).join(", ") || "Leadership, Communication, Problem Solving"}

ATS Match Score: **94%**

This resume is now highly optimized for the role.`;

    return {
      success: true,
      tailoredResume: mockTailored,
      atsScore: 94,
      keywordGaps: ["Few missing keywords detected"],
      strengths: ["Strong alignment with job requirements"],
      improvements: ["Add more specific metrics if possible"],
    };
  } catch (error: unknown) {
    console.error(error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to process resume",
    );
  }
}
