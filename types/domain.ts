import type { Database } from "@/types/database";

/**
 * Domain layer types for the product model.
 * `Database` rows are the source of truth; these aliases document relationships.
 */

export type ResumeRow = Database["public"]["Tables"]["resumes"]["Row"];
export type JobRow = Database["public"]["Tables"]["jobs"]["Row"];
export type ApplicationRow = Database["public"]["Tables"]["applications"]["Row"];

/** Parsed resume owned by a user; used for ATS + AI flows. */
export type Resume = ResumeRow;

/**
 * Canonical job posting record (company, title, description).
 * Applications may reference `job_id` while also denormalizing key fields for convenience.
 */
export type Job = JobRow;

/**
 * Application = user's pipeline entry: links optional Job + Resume, stores status and notes.
 * Relation: `application.job_id` → Job, `application.resume_id` → Resume (nullable).
 */
export type Application = ApplicationRow & {
  /** When joined from queries, nested job may be present (optional). */
  job?: Job | null;
};
