"use client";

import { useActionState } from "react";

import { submitJobPreview } from "@/app/actions/match-preview-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = { message: "" as string, error: undefined as string | undefined };

export function MatchPreviewForm() {
  const [state, formAction, pending] = useActionState(submitJobPreview, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-2 text-left">
          <Label htmlFor="jobTitle">Target role</Label>
          <Input
            id="jobTitle"
            name="jobTitle"
            placeholder="e.g. Senior Product Designer"
            required
            autoComplete="organization-title"
            className="h-11"
          />
        </div>
        <Button type="submit" disabled={pending} className="h-11 shrink-0 sm:min-w-36">
          {pending ? "Running…" : "Preview match"}
        </Button>
      </div>
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
