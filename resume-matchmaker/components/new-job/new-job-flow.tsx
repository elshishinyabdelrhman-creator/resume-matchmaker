"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

import { createApplication, type ApplicationFormState } from "@/app/actions/applications";
import { ResumeUploadZone } from "@/components/resume/resume-upload-zone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initial: ApplicationFormState = {};

type ResumeOption = { id: string; file_name: string };

const STEP_LABELS = ["Resume", "Role", "Create"] as const;

type NewJobFlowProps = {
  resumes: ResumeOption[];
};

/**
 * Three-step flow: attach a resume, capture the role, then create the application
 * (optionally deep-linking into the AI job match studio).
 */
export function NewJobFlow({ resumes: resumesFromServer }: NewJobFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [resumeId, setResumeId] = useState("");
  const [resumes, setResumes] = useState(resumesFromServer);
  const [state, formAction, pending] = useActionState(createApplication, initial);

  useEffect(() => {
    setResumes(resumesFromServer);
  }, [resumesFromServer]);

  useEffect(() => {
    if (resumes.length > 0 && !resumeId) {
      setResumeId(resumes[0]!.id);
    }
  }, [resumes, resumeId]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground">New application</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">New job</h1>
        <p className="max-w-2xl text-muted-foreground">
          Upload or pick a resume, paste the posting, then save to your tracker—or jump straight into
          AI tailoring.
        </p>
        <ol className="mt-2 flex gap-2" aria-label="Steps">
          {STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const active = step === n;
            const done = step > n;
            return (
              <li key={label} className="flex flex-1 items-center gap-2">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                    done
                      ? "border-primary bg-primary text-primary-foreground"
                      : active
                        ? "border-primary text-primary"
                        : "border-border text-muted-foreground",
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  {done ? <CheckCircle2 className="size-4" aria-hidden /> : n}
                </span>
                <span
                  className={cn(
                    "hidden text-sm font-medium sm:inline",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
                {i < STEP_LABELS.length - 1 ? (
                  <span className="mx-1 hidden h-px flex-1 bg-border sm:block" aria-hidden />
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>

      {step === 1 ? (
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg">1 · Resume</CardTitle>
              <Badge variant="secondary">Required</Badge>
            </div>
            <CardDescription>
              Upload a PDF or DOCX, then choose which file to attach to this application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ResumeUploadZone onUploadSuccess={() => router.refresh()} />
            <div className="space-y-2">
              <Label htmlFor="pick-resume">Resume for this application</Label>
              <select
                id="pick-resume"
                value={resumeId}
                onChange={(e) => setResumeId(e.target.value)}
                className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {resumes.length === 0 ? (
                  <option value="">Upload a resume above</option>
                ) : (
                  resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.file_name}
                    </option>
                  ))
                )}
              </select>
              <p className="text-xs text-muted-foreground">
                Manage files anytime in{" "}
                <Link href="/resume" className="text-foreground underline-offset-4 hover:underline">
                  Resumes
                </Link>
                .
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                onClick={() => setStep(2)}
                disabled={!resumeId || resumes.length === 0}
                className="gap-2"
              >
                Continue
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step >= 2 ? (
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="resumeId" value={resumeId} />
          <input type="hidden" name="status" value="draft" />

          {/* Keep role fields mounted on step 3 so the browser submits them with the action. */}
          <Card
            className={cn(
              "border-border/80 shadow-sm",
              step !== 2 && "sr-only h-0 overflow-hidden border-0 p-0 opacity-0",
            )}
            aria-hidden={step !== 2}
          >
            <CardHeader className={step !== 2 ? "hidden" : undefined}>
              <CardTitle className="text-lg">2 · Role & posting</CardTitle>
              <CardDescription>
                We store this with your application for ATS checks and AI runs.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" name="company" required className="h-11" />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="roleTitle">Role title</Label>
                  <Input id="roleTitle" name="roleTitle" required className="h-11" />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="jobDescription">Job description</Label>
                  <textarea
                    id="jobDescription"
                    name="jobDescription"
                    rows={8}
                    required
                    minLength={40}
                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[160px] w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    placeholder="Paste the posting—requirements, stack, and outcomes."
                  />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="sourceUrl">Listing URL (optional)</Label>
                  <Input id="sourceUrl" name="sourceUrl" type="url" placeholder="https://" className="h-11" />
                </div>
              </div>
              {step === 2 ? (
                <div className="flex flex-wrap justify-between gap-2">
                  <Button type="button" variant="ghost" className="gap-2" onClick={() => setStep(1)}>
                    <ArrowLeft className="size-4" aria-hidden />
                    Back
                  </Button>
                  <Button type="button" className="gap-2" onClick={() => setStep(3)}>
                    Review
                    <ArrowRight className="size-4" aria-hidden />
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {step === 3 ? (
            <Card className="border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">3 · Create</CardTitle>
                <CardDescription>
                  Save to your tracker, or continue into the job match studio with one click.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {state.error ? (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {state.error}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="ghost" className="gap-2" onClick={() => setStep(2)}>
                    <ArrowLeft className="size-4" aria-hidden />
                    Back
                  </Button>
                </div>
                <div className="grid gap-3 sm:flex sm:flex-wrap">
                  <Button
                    type="submit"
                    name="redirectTo"
                    value="detail"
                    disabled={pending}
                    variant="outline"
                    className="h-11 min-w-[160px]"
                  >
                    {pending ? "Saving…" : "Save to tracker"}
                  </Button>
                  <Button
                    type="submit"
                    name="redirectTo"
                    value="match"
                    disabled={pending}
                    className="h-11 min-w-[200px] gap-2"
                  >
                    {pending ? (
                      "Saving…"
                    ) : (
                      <>
                        <Sparkles className="size-4" aria-hidden />
                        Save &amp; AI tailor
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
