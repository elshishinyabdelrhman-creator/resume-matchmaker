const ALLOWED_PREFIXES = [
  "/",
  "/dashboard",
  "/new-job",
  "/resume",
  "/applications",
  "/tailor",
  "/ats",
  "/match",
] as const;

/**
 * Returns a safe in-app path for post-login redirects (blocks open redirects).
 */
export function safeNextPath(input: string | null | undefined, fallback = "/"): string {
  if (input == null || typeof input !== "string") {
    return fallback;
  }

  const trimmed = input.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  if (trimmed.includes("://") || trimmed.includes("\\")) {
    return fallback;
  }

  const allowed = ALLOWED_PREFIXES.some(
    (prefix) =>
      trimmed === prefix || (prefix !== "/" && trimmed.startsWith(`${prefix}/`)),
  );

  return allowed ? trimmed : fallback;
}
