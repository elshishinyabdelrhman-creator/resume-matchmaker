import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";

import { RESUME_TAILOR_PROMPT } from "@/lib/ai-prompts";

/** Groq Llama 3.3 70B — fast and strong for structured resume output. */
const model = groq("llama-3.3-70b-versatile");

export const resumeTailorResultSchema = z.object({
  tailoredResume: z.string().describe("Full resume in clean Markdown format"),
  atsScore: z.number().min(0).max(100),
  keywordGaps: z.array(z.string()),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
});

export type ResumeTailorResult = z.infer<typeof resumeTailorResultSchema>;

/**
 * Tailor a resume to a job using {@link RESUME_TAILOR_PROMPT} and structured output.
 * Requires `GROQ_API_KEY` (see default `groq` provider from `@ai-sdk/groq`).
 */
export async function tailorResume(
  originalResume: string,
  jobDescription: string,
  company: string,
  jobTitle: string,
): Promise<ResumeTailorResult> {
  const result = await generateObject({
    model,
    system: RESUME_TAILOR_PROMPT,
    prompt: `
Company: ${company}
Job Title: ${jobTitle}

Job Description:
${jobDescription}

Original Resume:
${originalResume}
    `,
    schema: resumeTailorResultSchema,
  });

  return result.object;
}
