/**
 * Supabase session refresh + route protection for the Edge middleware entry.
 * Keeps cookies in sync and redirects unauthenticated users away from workspace routes.
 */
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { safeNextPath } from "@/lib/auth/safe-next-path";
import type { Database } from "@/types/database";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/new-job",
  "/resume",
  "/applications",
  "/tailor",
  "/ats",
  "/match",
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (isProtectedPath(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if ((pathname === "/login" || pathname === "/signup") && user) {
    const destination = safeNextPath(request.nextUrl.searchParams.get("next"));
    const url = request.nextUrl.clone();
    url.pathname = destination;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
