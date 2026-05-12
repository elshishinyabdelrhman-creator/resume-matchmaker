import { ProtectedAppLayout } from "@/components/app/protected-app-layout";

/** /new-job — guided flow: resume → role details → create + optional AI tailor. */
export default function NewJobLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedAppLayout>{children}</ProtectedAppLayout>;
}
