"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  setApplicationStatus,
  updateApplicationNotesFromBoard,
} from "@/app/actions/application-board";
import { APPLICATION_STATUSES } from "@/lib/constants/applications";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ApplicationTrackingPanel({
  applicationId,
  status,
  notes,
}: {
  applicationId: string;
  status: string;
  notes: string | null;
}) {
  const router = useRouter();
  const [noteDraft, setNoteDraft] = useState(notes ?? "");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setNoteDraft(notes ?? "");
  }, [applicationId, notes]);

  const onStatusChange = (next: string) => {
    startTransition(() => {
      void (async () => {
        await setApplicationStatus(applicationId, next);
        router.refresh();
      })();
    });
  };

  const saveNotes = () => {
    startTransition(() => {
      void (async () => {
        await updateApplicationNotesFromBoard(applicationId, noteDraft);
        router.refresh();
      })();
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Tracking</CardTitle>
        <CardDescription>Status and notes sync with the Kanban board.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="app-status">Status</Label>
          <select
            id="app-status"
            value={status}
            disabled={pending}
            onChange={(e) => onStatusChange(e.target.value)}
            className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="app-notes">Notes</Label>
          <textarea
            id="app-notes"
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            rows={4}
            maxLength={5000}
            disabled={pending}
            className="border-input bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2"
            placeholder="Recruiter contacts, next steps, compensation…"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{noteDraft.length}/5000</span>
            <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={saveNotes}>
              {pending ? "Saving…" : "Save notes"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
