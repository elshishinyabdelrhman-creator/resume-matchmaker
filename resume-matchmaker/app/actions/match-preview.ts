"use server";

import { z } from "zod";

/**
 * Server-only entry for AI-assisted flows. Call model providers
 * (e.g. @ai-sdk/openai, @ai-sdk/groq) only from server actions or route handlers.
 */
const previewSchema = z.object({
  jobTitle: z.string().min(1).max(200),
});

export type MatchPreviewResult =
  | { ok: true; summary: string }
  | { ok: false; error: string };

export async function runMatchPreview(input: unknown): Promise<MatchPreviewResult> {
  const parsed = previewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please provide a valid job title." };
  }

  const hasProvider =
    Boolean(process.env.OPENAI_API_KEY) || Boolean(process.env.GROQ_API_KEY);

  if (!hasProvider) {
    return {
      ok: true,
      summary:
        `Preview for “${parsed.data.jobTitle}”: add OPENAI_API_KEY or GROQ_API_KEY to enable live AI scoring. ` +
        "Until then, uploads and parsing can still run client-free on the server.",
    };
  }

  return {
    ok: true,
    summary: `Preview for “${parsed.data.jobTitle}”: model calls will run here (server action only).`,
  };
}
