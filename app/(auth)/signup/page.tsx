import type { Metadata } from "next";

import { GoogleSignInForm } from "@/components/auth/google-sign-in-form";
import { SignupForm } from "@/components/auth/signup-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card className="border-0 bg-transparent p-0 py-0 shadow-none ring-0">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-center text-2xl font-semibold tracking-tight">
          Create account
        </CardTitle>
        <CardDescription className="text-center">
          Track applications, score against ATS, and tailor with AI.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 px-0">
        <GoogleSignInForm nextParam={rawNext} />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Separator className="flex-1" />
          <span className="shrink-0 uppercase tracking-wide">or email</span>
          <Separator className="flex-1" />
        </div>
        <SignupForm nextParam={rawNext} loginHref={`/login${loginQuery}`} />
      </CardContent>
    </Card>
  );
}
