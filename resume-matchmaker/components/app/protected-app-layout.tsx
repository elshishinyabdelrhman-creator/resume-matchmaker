import { AppShell } from "@/components/app/app-shell";
import { requireUser } from "@/lib/auth/session";

/**
 * Server-side guard for authenticated workspace routes (dashboard, applications, tools).
 * Ensures only signed-in users render children inside the app shell.
 */
export async function ProtectedAppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <AppShell userEmail={user.email ?? user.id}>{children}</AppShell>;
}
