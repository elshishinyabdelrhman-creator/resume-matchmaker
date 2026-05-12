"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { APPLICATION_STATUSES } from "@/lib/constants/applications";

const statusSchema = z.preprocess((val) => {
  if (typeof val !== "string" || val.trim() === "") return "draft";
  return val.trim();
}, z.enum(APPLICATION_STATUSES));

const optionalUrl = z
  .string()
  .max(2000)
  .optional()
  .transform((s) => {
    const t = (s ?? "").trim();
    return t.length > 0 ? t : undefined;
  })
  .refine((v) => v === undefined || z.string().url().safeParse(v).success, {
    message: "Invalid URL",
  });

const optionalUuid = z
  .string()
  .optional()
  .transform((s) => {
    const t = (s ?? "").trim();
    return t.length > 0 ? t : undefined;
  })
  .refine((v) => v === undefined || z.string().uuid().safeParse(v).success, {
    message: "Invalid resume selection",
  });

const createSchema = z.object({
  company: z.string().min(1).max(200),
  roleTitle: z.string().min(1).max(200),
  jobDescription: z.string().max(20000).optional(),
  sourceUrl: optionalUrl,
  resumeId: optionalUuid,
  status: statusSchema,
  notes: z.string().max(5000).optional(),
});

export type ApplicationFormState = { error?: string };

export async function createApplication(
  _prev: ApplicationFormState | undefined,
  formData: FormData,
): Promise<ApplicationFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sign in to track applications." };
  }

  const parsed = createSchema.safeParse({
    company: formData.get("company"),
    roleTitle: formData.get("roleTitle"),
    jobDescription: (formData.get("jobDescription") as string) || undefined,
    sourceUrl: (formData.get("sourceUrl") as string) || undefined,
    resumeId: (formData.get("resumeId") as string) || undefined,
    status: (formData.get("status") as string) || "draft",
    notes: (formData.get("notes") as string) || undefined,
  });

  if (!parsed.success) {
    return { error: "Check required fields and URLs." };
  }

  const payload = parsed.data;

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .insert({
      user_id: user.id,
      company: payload.company,
      title: payload.roleTitle,
      description: payload.jobDescription ?? null,
      source_url: payload.sourceUrl || null,
    })
    .select("id")
    .single();

  if (jobError || !job) {
    return { error: jobError?.message ?? "Could not save job." };
  }

  const { data, error } = await supabase
    .from("applications")
    .insert({
      user_id: user.id,
      job_id: job.id,
      company: payload.company,
      role_title: payload.roleTitle,
      job_description: payload.jobDescription ?? null,
      source_url: payload.sourceUrl || null,
      resume_id: payload.resumeId || null,
      status: payload.status,
      notes: payload.notes ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/applications/board");
  revalidatePath("/applications/list");

  const redirectToRaw = formData.get("redirectTo");
  const redirectTo = redirectToRaw === "match" ? "match" : "detail";

  if (redirectTo === "match") {
    redirect(`/match?applicationId=${data.id}`);
  }

  redirect(`/applications/${data.id}`);
}

const updateSchema = createSchema.extend({
  id: z.string().uuid(),
});

export async function updateApplication(
  _prev: ApplicationFormState | undefined,
  formData: FormData,
): Promise<ApplicationFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sign in to update applications." };
  }

  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    company: formData.get("company"),
    roleTitle: formData.get("roleTitle"),
    jobDescription: formData.get("jobDescription") || undefined,
    sourceUrl: formData.get("sourceUrl") || undefined,
    resumeId: formData.get("resumeId") || undefined,
    status: formData.get("status"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: "Invalid application update." };
  }

  const payload = parsed.data;

  const { data: existing } = await supabase
    .from("applications")
    .select("job_id")
    .eq("id", payload.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.job_id) {
    await supabase
      .from("jobs")
      .update({
        company: payload.company,
        title: payload.roleTitle,
        description: payload.jobDescription ?? null,
        source_url: payload.sourceUrl || null,
      })
      .eq("id", existing.job_id)
      .eq("user_id", user.id);
  }

  const { error } = await supabase
    .from("applications")
    .update({
      company: payload.company,
      role_title: payload.roleTitle,
      job_description: payload.jobDescription ?? null,
      source_url: payload.sourceUrl || null,
      resume_id: payload.resumeId || null,
      status: payload.status,
      notes: payload.notes ?? null,
    })
    .eq("id", payload.id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/applications/board");
  revalidatePath("/applications/list");
  revalidatePath(`/applications/${payload.id}`);
  return {};
}
