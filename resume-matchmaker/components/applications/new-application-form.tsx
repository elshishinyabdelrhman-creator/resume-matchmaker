"use client";

import { useActionState } from "react";

import { createApplication, type ApplicationFormState } from "@/app/actions/applications";
import { APPLICATION_STATUSES } from "@/lib/constants/applications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: ApplicationFormState = {};

type ResumeOption = { id: string; file_name: string };

export function NewApplicationForm({ resumes }: { resumes: ResumeOption[] }) {
  const [state, formAction, pending] = useActionState(createApplication, initial);

  return (
    <form action={formAction} className="mx-auto flex max-w-xl flex-col gap-4">
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
            rows={6}
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[120px] w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Paste the posting so ATS + AI can use it."
          />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="sourceUrl">Listing URL (optional)</Label>
          <Input id="sourceUrl" name="sourceUrl" type="url" placeholder="https://" className="h-11" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue="draft"
            className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="resumeId">Resume (optional)</Label>
          <select
            id="resumeId"
            name="resumeId"
            defaultValue=""
            className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">None</option>
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.file_name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="h-11 w-full sm:w-auto">
        {pending ? "Saving…" : "Create application"}
      </Button>
    </form>
  );
}
