"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/auth/safe-next-path";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginPageClientProps = {
  oauthError?: "oauth" | "oauth_config" | null;
  authCallbackError?: boolean;
};

export default function Login({ oauthError, authCallbackError }: LoginPageClientProps) {
  const searchParams = useSearchParams();
  const nextRaw = searchParams.get("next");
  const dest = safeNextPath(nextRaw, "/");
  const signupHref = nextRaw
    ? `/signup?next=${encodeURIComponent(nextRaw)}`
    : "/signup";

  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async () => {
    if (!email.trim() || !password) {
      toast.error("Enter email and password.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        toast.error(error.message);
      } else {
        window.location.assign(dest);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", dest);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback.toString() },
    });

    if (error) {
      toast.error(error.message);
    }
  };

  return (
    <Card className="w-full max-w-md border-zinc-800 bg-zinc-900 text-zinc-100 ring-1 ring-zinc-800 dark:bg-zinc-900">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-center text-2xl font-semibold tracking-tight">
          Welcome back
        </CardTitle>
        <p className="text-center text-sm text-zinc-400">Resume Matchmaker</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {authCallbackError ? (
          <p className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-center text-sm text-red-300">
            Sign-in could not be completed. Try again or use email and password.
          </p>
        ) : null}

        {oauthError === "oauth" || oauthError === "oauth_config" ? (
          <p className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-center text-sm text-red-300">
            {oauthError === "oauth_config"
              ? "Missing site URL. Set NEXT_PUBLIC_SITE_URL for OAuth redirects."
              : "Google sign-in failed. Try again or use email."}
          </p>
        ) : null}

        <Button
          type="button"
          onClick={() => void handleGoogle()}
          className="h-11 w-full border-zinc-700 bg-zinc-950/80 text-zinc-100 hover:bg-zinc-800"
          variant="outline"
          size="lg"
        >
          Continue with Google
        </Button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-zinc-900 px-2 text-zinc-500">or</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email" className="text-zinc-300">
              Email
            </Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-11 border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password" className="text-zinc-300">
              Password
            </Label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 border-zinc-700 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600"
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleEmailLogin();
              }}
            />
          </div>
          <Button
            type="button"
            onClick={() => void handleEmailLogin()}
            className="h-11 w-full gap-2"
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Signing in…
              </>
            ) : (
              "Sign in with email"
            )}
          </Button>
        </div>

        <p className="text-center text-sm text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link href={signupHref} className="text-blue-400 underline-offset-4 hover:underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
