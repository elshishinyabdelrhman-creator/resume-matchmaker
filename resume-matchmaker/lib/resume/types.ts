import { z } from "zod";

/** Structured resume extracted from raw text (AI or heuristics). */
export const resumeStructuredSchema = z.object({
  headline: z.string().optional().describe("Professional title or headline if present"),
  summary: z.string().optional().describe("Summary, profile, or objective section"),
  contact: z
    .object({
      email: z.string().optional(),
      phone: z.string().optional(),
      location: z.string().optional(),
      links: z.array(z.string()).optional(),
    })
    .optional(),
  skills: z.array(z.string()).optional(),
  experience: z
    .array(
      z.object({
        role: z.string(),
        company: z.string().optional(),
        location: z.string().optional(),
        dates: z.string().optional(),
        highlights: z.array(z.string()).optional(),
      }),
    )
    .optional(),
  education: z
    .array(
      z.object({
        institution: z.string(),
        degree: z.string().optional(),
        dates: z.string().optional(),
      }),
    )
    .optional(),
});

export type ResumeStructured = z.infer<typeof resumeStructuredSchema>;
