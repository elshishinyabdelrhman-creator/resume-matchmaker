import { DashboardHeader } from "@/components/app/dashboard-header";
import Sidebar from "@/components/Sidebar";
import { requireUser } from "@/lib/auth/session";

/** /dashboard — dedicated shell with fixed workspace sidebar (no AppShell double chrome). */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const userEmail = user.email ?? user.id;

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar userEmail={userEmail} />
      <main className="ml-64 flex-1 p-8 text-zinc-100">
        <DashboardHeader userEmail={userEmail} />
        {children}
      </main>
    </div>
  );
}
