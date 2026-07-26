"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/actions/auth";
import { actionFailure, type ActionResult } from "@/lib/actions/action-result";
import { safeRevalidatePath } from "@/lib/safe-revalidate";
import { sendEmail } from "@/lib/email/send";

export type PersonalTask = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  dueTime: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

function mapPersonalTask(row: {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  due_time: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}): PersonalTask {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    dueTime: row.due_time,
    completed: row.completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function revalidateTaskPaths() {
  safeRevalidatePath("/academics/tasks");
  safeRevalidatePath("/admin/tasks");
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

async function sendTodayTaskEmail(toEmail: string, title: string, dueTime: string | null) {
  try {
    await sendEmail({
      to: toEmail,
      subject: `Task due today — ${title}`,
      html: `<p>You created a task due today: <strong>${title}</strong>${
        dueTime ? ` at ${dueTime}` : ""
      }.</p>`,
    });
  } catch (error) {
    console.error("[personal-tasks] Failed to send due-today email:", error);
  }
}

export async function getMyTasks(): Promise<PersonalTask[]> {
  const profile = await getSessionProfile();
  if (!profile) throw new Error("Not signed in");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("personal_tasks")
    .select("*")
    .eq("user_id", profile.id)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return (data ?? []).map(mapPersonalTask);
}

export async function createPersonalTask(formData: FormData): Promise<ActionResult> {
  try {
    const profile = await getSessionProfile();
    if (!profile) return { ok: false, error: "Not signed in" };
    const supabase = await createClient();

    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const dueDate = String(formData.get("dueDate") ?? "").trim();
    const dueTime = String(formData.get("dueTime") ?? "").trim();

    if (title.length < 2) return { ok: false, error: "Title must be at least 2 characters" };

    const { error } = await supabase.from("personal_tasks").insert({
      user_id: profile.id,
      title,
      description: description || null,
      due_date: dueDate || null,
      due_time: dueTime || null,
    });
    if (error) return actionFailure(error, "Failed to create task");

    if (dueDate && dueDate === todayIsoDate()) {
      await sendTodayTaskEmail(profile.email, title, dueTime || null);
    }

    revalidateTaskPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to create task");
  }
}

export async function updatePersonalTask(taskId: string, formData: FormData): Promise<ActionResult> {
  try {
    const profile = await getSessionProfile();
    if (!profile) return { ok: false, error: "Not signed in" };
    const supabase = await createClient();

    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const dueDate = String(formData.get("dueDate") ?? "").trim();
    const dueTime = String(formData.get("dueTime") ?? "").trim();

    if (title.length < 2) return { ok: false, error: "Title must be at least 2 characters" };

    const { error } = await supabase
      .from("personal_tasks")
      .update({
        title,
        description: description || null,
        due_date: dueDate || null,
        due_time: dueTime || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .eq("user_id", profile.id);
    if (error) return actionFailure(error, "Failed to update task");

    revalidateTaskPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to update task");
  }
}

export async function toggleTaskCompleted(taskId: string, completed: boolean): Promise<ActionResult> {
  try {
    const profile = await getSessionProfile();
    if (!profile) return { ok: false, error: "Not signed in" };
    const supabase = await createClient();

    const { error } = await supabase
      .from("personal_tasks")
      .update({ completed, updated_at: new Date().toISOString() })
      .eq("id", taskId)
      .eq("user_id", profile.id);
    if (error) return actionFailure(error, "Failed to update task");

    revalidateTaskPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to update task");
  }
}

export async function deletePersonalTask(taskId: string): Promise<ActionResult> {
  try {
    const profile = await getSessionProfile();
    if (!profile) return { ok: false, error: "Not signed in" };
    const supabase = await createClient();

    const { error } = await supabase
      .from("personal_tasks")
      .delete()
      .eq("id", taskId)
      .eq("user_id", profile.id);
    if (error) return actionFailure(error, "Failed to delete task");

    revalidateTaskPaths();
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to delete task");
  }
}
