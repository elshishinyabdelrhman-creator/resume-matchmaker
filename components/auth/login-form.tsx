"use client";

import { useActionState } from "react";
import Link from "next/link";

import { signInWithPassword, type AuthFormState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: AuthFormState = {};

type LoginFormProps = {
  nextParam?: string | null;
  signupHref: string;
};

export function LoginForm({ nextParam, signupHref }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(signInWithPassword, initial);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={nextParam ?? ""} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-11"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          className="h-11"
        />
      </div>
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        No account?{" "}
        <Link href={signupHref} className="text-foreground underline-offset-4 hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
