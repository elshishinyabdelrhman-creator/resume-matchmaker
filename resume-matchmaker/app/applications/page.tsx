"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/constants/applications";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type ApplicationRow = {
  id: string;
  company: string;
  job_title: string;
  ats_score: number | null;
  status: string;
  created_at: string;
  tailored_resume: string | null;
};

const COLUMNS: { id: string; label: string; statuses: ApplicationStatus[] }[] = [
  { id: "pipeline", label: "Tailored", statuses: ["draft", "tailored"] },
  { id: "applied", label: "Applied", statuses: ["applied"] },
  { id: "interview", label: "Interview", statuses: ["interviewing"] },
  { id: "offer", label: "Offer", statuses: ["offer"] },
  { id: "closed", label: "Rejected", statuses: ["rejected", "closed"] },
];

const statusBadgeClass: Partial<Record<ApplicationStatus, string>> = {
  draft: "bg-muted text-muted-foreground",
  tailored: "bg-zinc-500 text-white",
  applied: "bg-blue-600 text-white",
  interviewing: "bg-purple-600 text-white",
  offer: "bg-emerald-600 text-white",
  rejected: "bg-red-600 text-white",
  closed: "bg-zinc-600 text-white",
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("applications")
      .select("id, company, job_title, ats_score, status, created_at, tailored_resume")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      setApplications([]);
    } else {
      setApplications((data ?? []) as ApplicationRow[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void fetchApplications();
  }, [fetchApplications]);

  async function updateStatus(id: string, newStatus: ApplicationStatus) {
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase
      .from("applications")
      .update({
        status: newStatus,
        applied_date: newStatus === "applied" ? today : null,
      })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    await fetchApplications();
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-8 pb-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Tracker</p>
        <h1 className="text-3xl font-semibold tracking-tight">Application tracker</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Column view of your pipeline. Status updates sync with the board and list. Open a card for
          full detail and tools.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading applications…</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
          {COLUMNS.map((col) => {
            const inColumn = applications.filter((a) =>
              col.statuses.includes(a.status as ApplicationStatus),
            );
            return (
              <div key={col.id}>
                <div className="mb-4 flex items-center gap-2">
                  <Badge className={cn("font-medium", statusBadgeClass[col.statuses[0]!])}>
                    {col.label.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{inColumn.length}</span>
                </div>

                <div className="space-y-4">
                  {inColumn.map((app) => (
                    <Card key={app.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg leading-tight">{app.company}</CardTitle>
                        <p className="text-sm text-muted-foreground">{app.job_title}</p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <Badge variant="outline">
                            Score: {app.ats_score != null ? `${app.ats_score}%` : "—"}
                          </Badge>
                          <Select
                            value={app.status}
                            onValueChange={(v: string) =>
                              void updateStatus(app.id, v as ApplicationStatus)
                            }
                          >
                            <SelectTrigger className="w-full sm:w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {APPLICATION_STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <Button variant="outline" className="w-full" asChild>
                          <Link href={`/applications/${app.id}`}>View application</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
