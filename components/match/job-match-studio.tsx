"use client";

import { useActionState, useEffect, useRef } from "react";
import { FileDown, Loader2, Rows3, Sparkles } from "lucide-react";

import { runJobMatchTailoring, type JobMatchActionState } from "@/app/actions/job-match";
import { MarkdownView } from "@/components/match/markdown-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initial: JobMatchActionState = {};

type ResumeOption = { id: string; file_name: string };

/** Optional defaults when arriving from an application (e.g. `/match?applicationId=…`). */
export type JobMatchPrefill = {
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  resumeId?: string | null;
};

export function JobMatchStudio({
  resumes,
  prefill,
}: {
  resumes: ResumeOption[];
  prefill?: JobMatchPrefill | null;
}) {
  const [state, formAction, pending] = useActionState(runJobMatchTailoring, initial);
  const resultRef = useRef<HTMLDivElement>(null);

  const defaultResumeId =
    prefill?.resumeId && resumes.some((r) => r.id === prefill.resumeId)
      ? prefill.resumeId
      : (resumes[0]?.id ?? "");

  const jdMinLength = prefill ? 40 : 80;

  useEffect(() => {
    if (state.result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [state.result]);

  return (
    <div className="space-y-8">
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-xl">Job targeting</CardTitle>
            <Badge variant="secondary">Claude or Groq</Badge>
          </div>
          <CardDescription>
            Paste the posting, pick your resume, and we will extract keywords, quantify wins, and
            return JSON plus a fully tailored Markdown resume.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company name</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  placeholder="e.g. Northwind Labs"
                  required
                  className="h-11"
                  defaultValue={prefill?.companyName ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job title</Label>
                <Input
                  id="jobTitle"
                  name="jobTitle"
                  placeholder="e.g. Senior Product Designer"
                  required
                  className="h-11"
                  defaultValue={prefill?.jobTitle ?? ""}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resumeId">Resume to tailor</Label>
              <select
                id="resumeId"
                name="resumeId"
                required
                defaultValue={defaultResumeId}
                className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {resumes.length === 0 ? (
                  <option value="">Upload a resume first</option>
                ) : (
                  resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.file_name}
                    </option>
                  ))
                )}
              </select>
              {resumes.length === 0 ? (
                <p className="text-xs text-destructive">Add a resume in the library to continue.</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobDescription">Full job description</Label>
              <textarea
                id="jobDescription"
                name="jobDescription"
                required
                minLength={jdMinLength}
                rows={10}
                placeholder="Paste the complete job description—requirements, responsibilities, and nice-to-haves."
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[220px] w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                defaultValue={prefill?.jobDescription ?? ""}
              />
              <p className="text-xs text-muted-foreground">
                Minimum {jdMinLength} characters so the model has enough context
                {prefill ? " (lower when you arrive from an application)." : "."}
              </p>
            </div>

            {state.error ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={pending || resumes.length === 0}
              className="h-11 gap-2 sm:w-auto sm:min-w-48"
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Tailoring with AI…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Generate tailored resume
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {state.result ? (
        <div ref={resultRef} className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Comparison</p>
              <h2 className="text-2xl font-semibold tracking-tight">
                {state.result.companyName} · {state.result.jobTitle}
              </h2>
              <p className="text-sm text-muted-foreground">Model: {state.result.modelLabel}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <a
                  href={`/api/export/tailored-resume?tailorRunId=${encodeURIComponent(state.result.tailorRunId)}`}
                  download
                >
                  <FileDown className="size-4" />
                  ATS-friendly PDF
                </a>
              </Button>
              <Badge variant="outline" className="gap-1">
                <Rows3 className="size-3.5" />
                Original vs tailored
              </Badge>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-border/80 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Original resume</CardTitle>
                <CardDescription>Parsed text from your library.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-[640px] overflow-y-auto rounded-xl border border-border bg-muted/20 p-4">
                  <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {state.result.originalResume}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/25 shadow-md ring-1 ring-primary/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tailored resume</CardTitle>
                <CardDescription>Markdown aligned to the job description.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-[640px] overflow-y-auto rounded-xl border border-border bg-background p-4">
                  <MarkdownView content={state.result.structured.tailoredResumeMarkdown} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Structured insights (JSON)</CardTitle>
              <CardDescription>
                Keywords, skills, and quantified bullets returned alongside the Markdown resume.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {state.result.structured.keySkillsToHighlight.map((skill, idx) => (
                  <Badge key={`${skill}-${idx}`} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
              <div className="max-h-[360px] overflow-auto rounded-xl border border-border bg-muted/30 p-4">
                <pre className="text-xs leading-relaxed sm:text-sm">
                  {JSON.stringify(state.result.structured, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
