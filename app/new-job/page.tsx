import type { Metadata } from "next";

import { NewJobFlow } from "@/components/new-job/new-job-flow";
import { requireUser } from "@/lib/auth/session";
import { listResumes } from "@/lib/data/resumes";

export const metadata: Metadata = {
  title: "New job",
};

/** Guided application intake: resume → posting → create (optional handoff to `/match`). */
export default async function NewJobPage() {
  const user = await requireUser();
  const resumes = await listResumes(user.id);

  return (
    <NewJobFlow
      resumes={resumes.map((r) => ({
        id: r.id,
        file_name: r.file_name,
      }))}
    />
  );
}
