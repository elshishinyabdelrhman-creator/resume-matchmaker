import type { Metadata } from "next";
import { z } from "zod";

import { JobMatchStudio } from "@/components/match/job-match-studio";
import { requireUser } from "@/lib/auth/session";
import { getApplication } from "@/lib/data/applications";
import { listResumes } from "@/lib/data/resumes";

export const metadata: Metadata = {
  title: "Job match studio",
};

type PageProps = {
  searchParams: Promise<{ applicationId?: string }>;
};

function buildJobDescriptionPrefill(raw: string | null | undefined): string {
  const base = (raw ?? "").trim();
  const hint =
    "\n\n(Add more detail from the posting if needed—stronger context yields better tailoring.)";
  if (base.length >= 80) return base;
  if (base.length > 0) return `${base}${hint}`;
  return `Paste the complete job description here.${hint}`;
}

export default async function MatchPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const resumes = await listResumes(user.id);
  const options = resumes.map((r) => ({ id: r.id, file_name: r.file_name }));

  let prefill: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    resumeId?: string | null;
  } | null = null;

  const appId = params.applicationId;
  if (appId && z.string().uuid().safeParse(appId).success) {
    const app = await getApplication(user.id, appId);
    if (app) {
      prefill = {
        companyName: app.company,
        jobTitle: app.role_title,
        jobDescription: buildJobDescriptionPrefill(app.job_description),
        resumeId: app.resume_id,
      };
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">AI tailoring</p>
        <h1 className="text-3xl font-semibold tracking-tight">Job match studio</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Claude (preferred) or Groq Llama 3.3 70B extracts keywords, sharpens metrics, and rewrites
          your resume—then you get JSON for tooling plus Markdown for humans.
        </p>
      </div>
      <JobMatchStudio resumes={options} prefill={prefill} />
    </div>
  );
}
