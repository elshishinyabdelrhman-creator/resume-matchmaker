import type { Metadata } from "next";
import Link from "next/link";

import { AtsSimulator } from "@/components/ats/ats-simulator";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "ATS scoring",
};

type ScoreRow = {
  id: string;
  overall_score: number;
  created_at: string;
  application_id: string | null;
  resume_id: string | null;
};

export default async function AtsPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: applications }, { data: resumes }] = await Promise.all([
    supabase.from("applications").select("id, company, role_title").eq("user_id", user.id),
    supabase.from("resumes").select("id, file_name").eq("user_id", user.id),
  ]);

  const appIds = applications?.map((a) => a.id) ?? [];
  const resumeIds = resumes?.map((r) => r.id) ?? [];
  const appById = new Map(applications?.map((a) => [a.id, a]) ?? []);
  const resumeById = new Map(resumes?.map((r) => [r.id, r]) ?? []);

  const [appScoresRes, simScoresRes] = await Promise.all([
    appIds.length
      ? supabase
          .from("ats_scores")
          .select("id, overall_score, created_at, application_id, resume_id")
          .in("application_id", appIds)
          .order("created_at", { ascending: false })
          .limit(40)
      : Promise.resolve({ data: [] as ScoreRow[] }),
    resumeIds.length
      ? supabase
          .from("ats_scores")
          .select("id, overall_score, created_at, application_id, resume_id")
          .is("application_id", null)
          .in("resume_id", resumeIds)
          .order("created_at", { ascending: false })
          .limit(40)
      : Promise.resolve({ data: [] as ScoreRow[] }),
  ]);

  const merged = [...(appScoresRes.data ?? []), ...(simScoresRes.data ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const seen = new Set<string>();
  const scores: ScoreRow[] = [];
  for (const row of merged) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    scores.push(row);
    if (scores.length >= 50) break;
  }

  const resumeOptions = resumes?.map((r) => ({ id: r.id, file_name: r.file_name })) ?? [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Signals</p>
        <h1 className="text-3xl font-semibold tracking-tight">ATS lab</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Run the simulator with any posting, see a 0–100 match estimate, missing keywords, and
          prioritized fixes. Application-level runs from your pipeline also appear in history.
        </p>
      </div>

      <AtsSimulator resumes={resumeOptions} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">History</CardTitle>
          <CardDescription>Latest simulator and application scores (newest first).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {scores.length === 0 ? (
            <p className="text-muted-foreground">No scores yet—run the simulator above.</p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {scores.map((row) => {
                const app = row.application_id ? appById.get(row.application_id) : undefined;
                const resume = row.resume_id ? resumeById.get(row.resume_id) : undefined;
                const isSim = row.application_id == null;

                return (
                  <li
                    key={row.id}
                    className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">
                          {isSim
                            ? `Simulator · ${resume?.file_name ?? "Resume"}`
                            : `${app?.company ?? "Company"} · ${app?.role_title ?? "Role"}`}
                        </p>
                        <Badge variant={isSim ? "secondary" : "outline"} className="text-[10px]">
                          {isSim ? "Free run" : "Application"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(row.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-semibold tabular-nums">
                        {row.overall_score}
                        <span className="text-sm font-normal text-muted-foreground">%</span>
                      </span>
                      {row.application_id ? (
                        <Link
                          href={`/applications/${row.application_id}`}
                          className="text-sm text-primary underline-offset-4 hover:underline"
                        >
                          Open
                        </Link>
                      ) : null}
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
