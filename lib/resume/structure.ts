import { generateObject } from "ai";

import { buildResumeStructurePrompt } from "@/lib/ai-prompts";
import { getLanguageModel } from "@/lib/ai/server-model";

import { type ResumeStructured, resumeStructuredSchema } from "@/lib/resume/types";

function normalizeLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function takeSection(lines: string[], startRegex: RegExp, stopRegex: RegExp): string[] {
  const start = lines.findIndex((l) => startRegex.test(l));
  if (start === -1) return [];
  const rest = lines.slice(start + 1);
  const stop = rest.findIndex((l) => stopRegex.test(l) && l.length < 80);
  const slice = stop === -1 ? rest : rest.slice(0, stop);
  return slice.filter((l) => l.length > 0);
}

/**
 * Lightweight section split when no LLM is configured or the model call fails.
 */
export function buildHeuristicStructure(rawText: string): ResumeStructured {
  const lines = normalizeLines(rawText);
  if (lines.length === 0) {
    return {};
  }

  const heading = /^[A-Z][A-Z0-9 &/\-]{2,}$/;
  const stop = /^([A-Z][A-Z0-9 &/\-]{2,}|Skills|Experience|Work|Education|Projects|Summary|Profile)$/i;

  const skillLines = takeSection(lines, /^(skills|technical skills|core competencies)$/i, stop);
  const skills =
    skillLines.length > 0
      ? skillLines
          .flatMap((l) => l.split(/[,•|]/))
          .map((s) => s.trim())
          .filter((s) => s.length > 1 && s.length < 60)
          .slice(0, 40)
      : undefined;

  const expLines = takeSection(
    lines,
    /^(experience|work experience|professional experience|employment)$/i,
    stop,
  );
  const experience =
    expLines.length > 0
      ? [
          {
            role: expLines[0] ?? "Experience",
            highlights: expLines.slice(1, 12),
          },
        ]
      : undefined;

  const eduLines = takeSection(lines, /^(education|academic background)$/i, stop);
  const education =
    eduLines.length > 0
      ? eduLines.slice(0, 6).map((line) => ({
          institution: line,
        }))
      : undefined;

  const summaryLines = takeSection(lines, /^(summary|profile|objective|about)$/i, stop);
  const summary =
    summaryLines.length > 0 ? summaryLines.join(" ").slice(0, 1200) : lines.slice(0, 4).join(" ").slice(0, 800);

  return {
    headline: lines.find((l) => l.length > 3 && l.length < 80 && !heading.test(l)),
    summary,
    skills,
    experience,
    education,
  };
}

export async function extractStructuredResume(rawText: string): Promise<ResumeStructured> {
  const trimmed = rawText.trim();
  if (trimmed.length < 20) {
    return {};
  }

  const model = getLanguageModel();
  if (model) {
    try {
      const { object } = await generateObject({
        model,
        schema: resumeStructuredSchema,
        prompt: buildResumeStructurePrompt(trimmed.slice(0, 14_000)),
      });
      return object;
    } catch {
      // fall back to heuristics
    }
  }

  return buildHeuristicStructure(trimmed);
}
