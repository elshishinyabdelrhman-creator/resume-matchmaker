import type { Metadata } from "next";
import { Suspense } from "react";

import Login from "@/components/auth/login-page-client";

export const metadata: Metadata = {
  title: "Sign in",
};

type PageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const oauthError =
    params.error === "oauth" || params.error === "oauth_config" ? params.error : null;
  const authCallbackError = params.error === "auth" ? true : false;

  return (
    <Suspense
      fallback={
        <p className="text-center text-sm text-muted-foreground">Loading sign-in…</p>
      }
    >
      <Login authCallbackError={authCallbackError} oauthError={oauthError} />
    </Suspense>
  );
}
