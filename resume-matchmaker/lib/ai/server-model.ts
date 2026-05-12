import { createAnthropic } from "@ai-sdk/anthropic";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

/**
 * Default chat model for lightweight tasks (upload structuring, etc.).
 */
export function getLanguageModel() {
  if (process.env.OPENAI_API_KEY) {
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return openai("gpt-4o-mini");
  }
  if (process.env.GROQ_API_KEY) {
    const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
    return groq("llama-3.3-70b-versatile");
  }
  return null;
}

export type TailoringModel = {
  model: LanguageModel;
  label: string;
};

/**
 * Heavyweight tailoring: Claude when configured, otherwise Groq Llama 3.3 70B.
 */
export function getTailoringModel(): TailoringModel | null {
  if (process.env.ANTHROPIC_API_KEY) {
    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const modelId =
      process.env.ANTHROPIC_MODEL?.trim() || "claude-3-5-sonnet-latest";
    return {
      model: anthropic(modelId),
      label: `Anthropic ${modelId}`,
    };
  }
  if (process.env.GROQ_API_KEY) {
    const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
    return {
      model: groq("llama-3.3-70b-versatile"),
      label: "Groq Llama 3.3 70B",
    };
  }
  return null;
}
