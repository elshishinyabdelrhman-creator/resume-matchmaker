import { createClient } from "@/lib/supabase/server";

export async function listResumes(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listResumes:", error.message);
    return [];
  }

  return data ?? [];
}
