import { redirect } from "next/navigation";

import DashboardContent from "@/components/DashboardContent";
import { ProtectedAppLayout } from "@/components/app/protected-app-layout";
import { createClient } from "@/lib/supabase/server";

/**
 * Authenticated entry: resume optimizer. Unauthenticated users go to /login.
 */
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <ProtectedAppLayout>
      <DashboardContent />
    </ProtectedAppLayout>
  );
}
