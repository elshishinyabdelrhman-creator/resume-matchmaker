import type { Metadata } from "next";

import { GoogleSignInForm } from "@/components/auth/google-sign-in-form";
import { SignupForm } from "@/components/auth/signup-form";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Create account",
};

type PageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function SignupPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const rawNext = typeof params.next === "string" ? params.next : undefined;
  const loginQuery = rawNext ? `?next=${encodeURIComponent(rawNext)}` : "";

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          Track applications, score against ATS, and tailor with AI.
        </p>
      </div>
      <GoogleSignInForm nextParam={rawNext} />
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <Separator className="flex-1" />
        <span className="shrink-0 uppercase tracking-wide">or email</span>
        <Separator className="flex-1" />
      </div>
      <SignupForm nextParam={rawNext} loginHref={`/login${loginQuery}`} />
    </div>
  );
}
