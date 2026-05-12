"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/auth/safe-next-path";
import { Button } from "@/components/ui/button";
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

  const handleLogin = async () => {
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
    <div className="flex flex-col gap-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Resume Matchmaker</h1>
        <p className="text-sm text-muted-foreground">Sign in to continue.</p>
      </div>

      {authCallbackError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
          Sign-in could not be completed. Try again or use email and password.
        </p>
      ) : null}

      {oauthError === "oauth" || oauthError === "oauth_config" ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
          {oauthError === "oauth_config"
            ? "Missing site URL. Set NEXT_PUBLIC_SITE_URL for OAuth redirects."
            : "Google sign-in failed. Try again or use email."}
        </p>
      ) : null}

      <Button type="button" onClick={() => void handleGoogle()} className="h-12 w-full" variant="outline" size="lg">
        Sign in with Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="login-password">Password</Label>
          <Input
            id="login-password"
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11"
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleLogin();
            }}
          />
        </div>
      </div>

      <Button
        type="button"
        onClick={() => void handleLogin()}
        className="h-11 w-full"
        disabled={loading}
      >
        {loading ? <Loader2 className="size-5 animate-spin" aria-hidden /> : "Sign in"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href={signupHref} className="text-primary underline-offset-4 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
