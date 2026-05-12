import { ProtectedAppLayout } from "@/components/app/protected-app-layout";

/** /dashboard — overview, resume shortcuts, pipeline entry points. */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedAppLayout>{children}</ProtectedAppLayout>;
}
