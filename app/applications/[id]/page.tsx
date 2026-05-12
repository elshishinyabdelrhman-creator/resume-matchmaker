import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ApplicationTrackingPanel } from "@/components/applications/application-tracking-panel";
import { ApplicationWorkbench } from "@/components/applications/application-workbench";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getApplication } from "@/lib/data/applications";
import { createClient } from "@/lib/supabase/server";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Application ${id.slice(0, 8)}` };
}

export default async function ApplicationDetailPage({ params }: PageProps) {
  const user = await requireUser();
  const { id } = await params;
  const application = await getApplication(user.id, id);
  if (!application) {
    notFound();
  }

  const supabase = await createClient();
  const { data: scores } = await supabase
    .from("ats_scores")
    .select("id, overall_score, created_at, breakdown")
    .eq("application_id", application.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: tailorRuns } = await supabase
    .from("tailor_runs")
    .select("id, created_at, model")
    .eq("application_id", application.id)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
            <Link href="/applications/board">← Back to board</Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {application.company} · {application.role_title}
            </h1>
            <Badge variant="secondary" className="capitalize">
              {application.status}
            </Badge>
          </div>
          {application.source_url ? (
            <a
              href={application.source_url}
              className="text-sm text-primary underline-offset-4 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              View listing
            </a>
          ) : null}
        </div>
      </div>

      <ApplicationTrackingPanel
        applicationId={application.id}
        status={application.status}
        notes={application.notes}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Job description</CardTitle>
          <CardDescription>Used by ATS scoring and AI tailoring.</CardDescription>
        </CardHeader>
        <CardContent>
          {application.job_description ? (
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-4 text-sm leading-relaxed">
              {application.job_description}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">No description saved yet.</p>
          )}
        </CardContent>
      </Card>

      <ApplicationWorkbench applicationId={application.id} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent ATS scores</CardTitle>
            <CardDescription>Newest runs for this application.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {!scores?.length ? (
              <p className="text-muted-foreground">No scores yet.</p>
            ) : (
              <ul className="space-y-2">
                {scores.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                  >
                    <span className="text-muted-foreground">
                      {new Date(s.created_at).toLocaleString()}
                    </span>
                    <span className="font-semibold">{s.overall_score}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI tailoring runs</CardTitle>
            <CardDescription>Stored suggestions for auditability.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {!tailorRuns?.length ? (
              <p className="text-muted-foreground">No AI runs yet.</p>
            ) : (
              <ul className="space-y-2">
                {tailorRuns.map((run) => (
                  <li
                    key={run.id}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                  >
                    <span className="text-muted-foreground">
                      {new Date(run.created_at).toLocaleString()}
                    </span>
                    <span className="text-xs uppercase text-muted-foreground">
                      {run.model ?? "model"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
