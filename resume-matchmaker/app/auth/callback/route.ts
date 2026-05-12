import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

import { safeNextPath } from "@/lib/auth/safe-next-path";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=auth", origin).toString());
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=auth", origin).toString());
  }

  // Refresh cookie-backed session after code exchange (harmless if already synced).
  await supabase.auth.getSession();

  return NextResponse.redirect(new URL(next, origin).toString());
}
