import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "AI tailoring",
};

export default async function TailorPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: runs } = await supabase
    .from("tailor_runs")
    .select("id, created_at, application_id, model")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">AI</p>
        <h1 className="text-2xl font-semibold tracking-tight">Tailoring history</h1>
        <p className="mt-1 text-muted-foreground">
          Every run is executed in a server action. Open an application to generate new
          suggestions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent runs</CardTitle>
          <CardDescription>Jump back to the application for full context.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {!runs?.length ? (
            <p className="text-muted-foreground">No tailoring runs yet.</p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {runs.map((run) => (
                <li key={run.id} className="flex flex-col gap-1 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">
                      {new Date(run.created_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Model: {run.model ?? "n/a"}
                    </p>
                  </div>
                  {run.application_id ? (
                    <Link
                      href={`/applications/${run.application_id}`}
                      className="text-sm text-primary underline-offset-4 hover:underline"
                    >
                      Open application
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground">No application linked</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
