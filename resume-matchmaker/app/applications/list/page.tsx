import type { Metadata } from "next";
import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import { listApplications } from "@/lib/data/applications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Applications · List",
};

export default async function ApplicationsListPage() {
  const user = await requireUser();
  const applications = await listApplications(user.id);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Pipeline</p>
          <h1 className="text-2xl font-semibold tracking-tight">All applications</h1>
          <p className="mt-1 text-muted-foreground">
            Table view—use the Kanban board for drag-and-drop status updates.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/applications/board">Kanban board</Link>
          </Button>
          <Button asChild>
            <Link href="/applications/new">New application</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Roles</CardTitle>
          <CardDescription>Sorted by last update.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {applications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No applications yet.</p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {applications.map((app) => (
                <li key={app.id}>
                  <Link
                    href={`/applications/${app.id}`}
                    className="flex flex-col gap-2 px-3 py-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">
                        {app.company} · {app.role_title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Updated {new Date(app.updated_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="secondary" className="w-fit capitalize">
                      {app.status}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
