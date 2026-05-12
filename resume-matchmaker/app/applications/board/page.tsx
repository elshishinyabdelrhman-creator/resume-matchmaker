import type { Metadata } from "next";
import Link from "next/link";

import { ApplicationKanbanBoard } from "@/components/applications/application-kanban-board";
import { requireUser } from "@/lib/auth/session";
import { listApplications } from "@/lib/data/applications";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Application tracker",
};

export default async function ApplicationsBoardPage() {
  const user = await requireUser();
  const applications = await listApplications(user.id);

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Tracker</p>
          <h1 className="text-3xl font-semibold tracking-tight">Application board</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Drag cards across Applied, Interview, Offer, and Rejected. Notes save per role—open a card
            for full detail, ATS, and AI tools.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/applications/list">Table view</Link>
          </Button>
          <Button asChild>
            <Link href="/applications/new">New application</Link>
          </Button>
        </div>
      </div>

      <ApplicationKanbanBoard applications={applications} />
    </div>
  );
}
