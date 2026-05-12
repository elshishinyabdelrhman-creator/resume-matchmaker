import { ProtectedAppLayout } from "@/components/app/protected-app-layout";

/** /tailor — history and details of AI tailoring runs. */
export default function TailorLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedAppLayout>{children}</ProtectedAppLayout>;
}
