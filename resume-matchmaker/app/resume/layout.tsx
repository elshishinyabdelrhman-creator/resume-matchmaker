import { ProtectedAppLayout } from "@/components/app/protected-app-layout";

/** /resume — upload, parse, and manage resume files (Supabase Storage + extracted text). */
export default function ResumeLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedAppLayout>{children}</ProtectedAppLayout>;
}
