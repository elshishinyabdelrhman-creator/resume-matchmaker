"use client";

import { useActionState } from "react";

import { scoreApplicationAts, type AtsActionState } from "@/app/actions/ats";
import { tailorResumeToJob, type TailorActionState } from "@/app/actions/tailor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const atsInitial: AtsActionState = {};
const tailorInitial: TailorActionState = {};

export function ApplicationWorkbench({ applicationId }: { applicationId: string }) {
  const [atsState, atsAction, atsPending] = useActionState(scoreApplicationAts, atsInitial);
  const [tailorState, tailorAction, tailorPending] = useActionState(
    tailorResumeToJob,
    tailorInitial,
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ATS scoring</CardTitle>
          <CardDescription>
            Heuristic keyword and structure score against the saved job description.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <form action={atsAction} className="flex flex-col gap-3">
            <input type="hidden" name="applicationId" value={applicationId} />
            <Button type="submit" disabled={atsPending} variant="secondary">
              {atsPending ? "Scoring…" : "Run ATS score"}
            </Button>
          </form>
          {atsState.error ? (
            <p className="text-sm text-destructive">{atsState.error}</p>
          ) : null}
          {atsState.ok ? (
            <p className="text-sm text-muted-foreground">
              Score saved with keyword + tip payload. Open the ATS lab for the full simulator view.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI tailoring</CardTitle>
          <CardDescription>
            Server-side model suggestions—requires API keys and parsed resume text.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <form action={tailorAction} className="flex flex-col gap-3">
            <input type="hidden" name="applicationId" value={applicationId} />
            <Button type="submit" disabled={tailorPending}>
              {tailorPending ? "Generating…" : "Generate suggestions"}
            </Button>
          </form>
          {tailorState.error ? (
            <p className="text-sm text-destructive">{tailorState.error}</p>
          ) : null}
          {tailorState.summary ? (
            <div className="max-w-none rounded-lg border border-border bg-muted/30 p-3 text-sm leading-relaxed">
              <p className="whitespace-pre-wrap">{tailorState.summary}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
