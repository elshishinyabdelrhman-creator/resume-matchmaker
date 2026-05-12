"use server";

import { runMatchPreview } from "@/app/actions/match-preview";

export type PreviewFormState = {
  message: string;
  error?: string;
};

export async function submitJobPreview(
  _prevState: PreviewFormState | undefined,
  formData: FormData,
): Promise<PreviewFormState> {
  const jobTitle = formData.get("jobTitle");
  const result = await runMatchPreview({ jobTitle });
  if (!result.ok) {
    return { message: "", error: result.error };
  }
  return { message: result.summary };
}
