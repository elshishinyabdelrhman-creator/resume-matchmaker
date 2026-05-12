import { ProtectedAppLayout } from "@/components/app/protected-app-layout";

/** /ats — ATS-style scoring and breakdown for applications. */
export default function AtsLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedAppLayout>{children}</ProtectedAppLayout>;
}
