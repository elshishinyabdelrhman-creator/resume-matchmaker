import { ProtectedAppLayout } from "@/components/app/protected-app-layout";

/** /applications/* — tracker (board, list, detail, legacy /new redirect). */
export default function ApplicationsLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedAppLayout>{children}</ProtectedAppLayout>;
}
