/**
 * Server-only AI helpers (schemas, model selection).
 * Do not import this entry from Client Components — keep keys and calls on the server.
 */

export { jobMatchResultSchema, type JobMatchResult } from "@/lib/ai/job-match-schema";
export { getLanguageModel } from "@/lib/ai/server-model";
export {
  tailorResume,
  resumeTailorResultSchema,
  type ResumeTailorResult,
} from "@/lib/ai/tailor-resume";
