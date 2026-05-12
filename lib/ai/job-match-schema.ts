import { z } from "zod";

/** Structured output from the job-match / resume tailoring model. */
export const jobMatchResultSchema = z.object({
  extractedJobKeywords: z
    .array(z.string())
    .describe("Important keywords and phrases from the job description for ATS alignment"),
  keySkillsToHighlight: z
    .array(z.string())
    .describe("Skills and themes the tailored resume should foreground"),
  quantifiedAchievements: z
    .array(
      z.object({
        originalBullet: z.string().describe("Original resume bullet or line"),
        tailoredBullet: z
          .string()
          .describe(
            "Rewritten bullet with stronger metrics or specificity; do not invent employers or dates",
          ),
      }),
    )
    .describe("Before/after bullets emphasizing measurable outcomes"),
  tailoredResumeMarkdown: z
    .string()
    .describe(
      "Complete tailored resume in polished Markdown with clear section headings and bullet lists",
    ),
  honestNotes: z
    .array(z.string())
    .optional()
    .describe("Optional caveats when information is inferred vs explicit in the source resume"),
});

export type JobMatchResult = z.infer<typeof jobMatchResultSchema>;
