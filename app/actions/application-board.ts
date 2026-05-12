"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import {
  APPLICATION_STATUSES,
  KANBAN_COLUMN_TO_STATUS,
  type KanbanColumnId,
} from "@/lib/constants/applications";

const statusSchema = z.enum(APPLICATION_STATUSES);

export type BoardActionResult = { error?: string; ok?: boolean };

export async function updateApplicationStatusFromBoard(
  applicationId: string,
  columnId: KanbanColumnId,
): Promise<BoardActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sign in required." };
  }

  const nextStatus = KANBAN_COLUMN_TO_STATUS[columnId];

  const { error } = await supabase
    .from("applications")
    .update({ status: nextStatus })
    .eq("id", applicationId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/applications/board");
  revalidatePath("/applications/list");
  revalidatePath(`/applications/${applicationId}`);
  return { ok: true };
}

export async function updateApplicationNotesFromBoard(
  applicationId: string,
  notes: string,
): Promise<BoardActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sign in required." };
  }

  const parsed = z.string().max(5000).safeParse(notes);
  if (!parsed.success) {
    return { error: "Notes must be 5000 characters or less." };
  }

  const { error } = await supabase
    .from("applications")
    .update({ notes: parsed.data })
    .eq("id", applicationId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/applications/board");
  revalidatePath("/applications/list");
  revalidatePath(`/applications/${applicationId}`);
  return { ok: true };
}

/** Direct status set (e.g. from detail page). */
export async function setApplicationStatus(applicationId: string, status: string): Promise<BoardActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sign in required." };
  }

  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) {
    return { error: "Invalid status." };
  }

  const { error } = await supabase
    .from("applications")
    .update({ status: parsed.data })
    .eq("id", applicationId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/applications/board");
  revalidatePath("/applications/list");
  revalidatePath(`/applications/${applicationId}`);
  return { ok: true };
}
