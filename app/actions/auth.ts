"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { safeNextPath } from "@/lib/auth/safe-next-path";
import { createClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type AuthFormState = { error?: string };

export async function signInWithPassword(
  _prev: AuthFormState | undefined,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email and password (8+ characters)." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: error.message };
  }

  const next = safeNextPath(formData.get("next") as string | null);
  redirect(next);
}

export async function signUpWithPassword(
  _prev: AuthFormState | undefined,
  formData: FormData,
): Promise<AuthFormState> {
  const fullName = z.string().min(1).max(120).safeParse(formData.get("fullName"));
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success || !fullName.success) {
    return { error: "Check your name, email, and password (8+ characters)." };
  }

  const hdrs = await headers();
  const origin = hdrs.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const next = safeNextPath(formData.get("next") as string | null);

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: origin
        ? `${origin}/auth/callback?next=${encodeURIComponent(next)}`
        : undefined,
      data: { full_name: fullName.data },
    },
  });
  if (error) {
    return { error: error.message };
  }

  redirect(next);
}

export async function signInWithGoogle(formData: FormData) {
  const hdrs = await headers();
  const origin = hdrs.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  if (!origin) {
    redirect("/login?error=oauth_config");
  }

  const next = safeNextPath(formData.get("next") as string | null);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    redirect("/login?error=oauth");
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
