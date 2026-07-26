"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/actions/auth";
import { actionFailure, type ActionResult } from "@/lib/actions/action-result";
import { safeRevalidatePath } from "@/lib/safe-revalidate";

export type PersonalNote = {
  id: string;
  userId: string;
  title: string;
  content: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapPersonalNote(row: {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string;
}): PersonalNote {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function revalidateNotePaths() {
  safeRevalidatePath("/academics/tasks");
  safeRevalidatePath("/admin/tasks");
}

export async function getMyNotes(): Promise<PersonalNote[]> {
  const profile = await getSessionProfile();
  if (!profile) throw new Error("Not signed in");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("personal_notes")
    .select("*")
    .eq("user_id", profile.id)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);

  return (data ?? []).map(mapPersonalNote);
}

export async function createPersonalNote(formData: FormData): Promise<ActionResult> {
  try {
    const profile = await getSessionProfile();
    if (!profile) return { ok: false, error: "Not signed in" };
    const supabase = await createClient();

    const title = String(formData.get("title") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();
    if (title.length < 1) return { ok: false, error: "Give the note a title" };

    const { error } = await supabase.from("personal_notes").insert({
      user_id: profile.id,
      title,
      content: content || null,
    });
    if (error) return actionFailure(error, "Failed to create note");

    revalidateNotePaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to create note");
  }
}

export async function updatePersonalNote(noteId: string, formData: FormData): Promise<ActionResult> {
  try {
    const profile = await getSessionProfile();
    if (!profile) return { ok: false, error: "Not signed in" };
    const supabase = await createClient();

    const title = String(formData.get("title") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();
    if (title.length < 1) return { ok: false, error: "Give the note a title" };

    const { error } = await supabase
      .from("personal_notes")
      .update({ title, content: content || null, updated_at: new Date().toISOString() })
      .eq("id", noteId)
      .eq("user_id", profile.id);
    if (error) return actionFailure(error, "Failed to update note");

    revalidateNotePaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to update note");
  }
}

export async function deletePersonalNote(noteId: string): Promise<ActionResult> {
  try {
    const profile = await getSessionProfile();
    if (!profile) return { ok: false, error: "Not signed in" };
    const supabase = await createClient();

    const { error } = await supabase
      .from("personal_notes")
      .delete()
      .eq("id", noteId)
      .eq("user_id", profile.id);
    if (error) return actionFailure(error, "Failed to delete note");

    revalidateNotePaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to delete note");
  }
}
