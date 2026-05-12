import { createClient } from "@/lib/supabase/server";

export async function listApplications(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("listApplications:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getApplication(userId: string, id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getApplication:", error.message);
    return null;
  }

  return data;
}
