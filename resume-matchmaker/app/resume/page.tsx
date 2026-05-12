import type { Metadata } from "next";

import { ResumeUploadZone } from "@/components/resume/resume-upload-zone";
import { requireUser } from "@/lib/auth/session";
import { listResumes } from "@/lib/data/resumes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Resumes",
};

export default async function ResumePage() {
  const user = await requireUser();
  const resumes = await listResumes(user.id);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Library</p>
        <h1 className="text-2xl font-semibold tracking-tight">Resumes</h1>
        <p className="mt-1 text-muted-foreground">
          Files live in the private `resumes` storage bucket. Text and structured JSON are stored for
          ATS and AI flows.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload & parse</CardTitle>
          <CardDescription>
            Drag in a PDF or DOCX. We extract text, build structured sections, and keep the original
            file in Supabase Storage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResumeUploadZone />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your files</CardTitle>
          <CardDescription>Most recent first.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {resumes.length === 0 ? (
            <p className="text-muted-foreground">No resumes yet—upload one to get started.</p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {resumes.map((r) => {
                const structured = r.structured_data as { headline?: string } | null;
                const headline =
                  structured && typeof structured.headline === "string"
                    ? structured.headline
                    : null;

                return (
                  <li
                    key={r.id}
                    className="flex flex-col gap-1 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">{r.file_name}</p>
                      {headline ? (
                        <p className="text-xs text-muted-foreground line-clamp-2">{headline}</p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        {r.parsed_text ? "Text + structure saved" : "Awaiting text"} ·{" "}
                        {new Date(r.created_at).toLocaleString()}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
