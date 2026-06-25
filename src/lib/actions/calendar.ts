"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/actions/auth";
import { computeDurationMinutes } from "@/lib/calendar/utils";

export async function addSubjectCategory(data: {
  name: string;
  slug: string;
  color?: string;
  sortOrder?: number;
}) {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.from("subject_categories").insert({
    name: data.name,
    slug: data.slug,
    color: data.color ?? "#273461",
    sort_order: data.sortOrder ?? 0,
    active: true,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/categories");
  revalidatePath("/calendar");
}

export async function updateSubjectCategory(
  id: string,
  data: { name?: string; color?: string; sortOrder?: number; active?: boolean }
) {
  await requireStaff();
  const supabase = await createClient();
  const patch: Record<string, unknown> = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.color !== undefined) patch.color = data.color;
  if (data.sortOrder !== undefined) patch.sort_order = data.sortOrder;
  if (data.active !== undefined) patch.active = data.active;
  const { error } = await supabase.from("subject_categories").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/categories");
}

export async function deleteSubjectCategory(id: string) {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.from("subject_categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/categories");
}

export async function addCalendarSession(data: {
  categoryId: string;
  courseId?: string;
  title: string;
  sessionType: "recurring" | "one_off";
  dayOfWeek?: number;
  sessionDate?: string;
  startTime: string;
  endTime: string;
  teacherName?: string;
  room?: string;
  mode?: "physical" | "online";
}) {
  await requireStaff();
  const duration = computeDurationMinutes(data.startTime, data.endTime);
  if (duration <= 0) throw new Error("End time must be after start time");

  const supabase = await createClient();
  const { error } = await supabase.from("calendar_sessions").insert({
    category_id: data.categoryId,
    course_id: data.courseId ?? null,
    title: data.title,
    session_type: data.sessionType,
    day_of_week: data.sessionType === "recurring" ? data.dayOfWeek ?? 1 : null,
    session_date: data.sessionType === "one_off" ? data.sessionDate ?? null : null,
    start_time: data.startTime,
    end_time: data.endTime,
    teacher_name: data.teacherName ?? "",
    room: data.room ?? "",
    mode: data.mode ?? "physical",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/calendar");
  revalidatePath("/calendar");
}

export async function deleteCalendarSession(id: string) {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.from("calendar_sessions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/calendar");
  revalidatePath("/calendar");
}
