import { ProtectedAppLayout } from "@/components/app/protected-app-layout";

/** /match — AI job match studio (tailored resume + structured output). */
export default function MatchLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedAppLayout>{children}</ProtectedAppLayout>;
}
