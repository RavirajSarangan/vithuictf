"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/actions/auth";
import { signUpWithRole } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/audit";
import { sendStudentWelcomeEmail } from "@/lib/actions/email";
import { BRAND } from "@/lib/constants";

export async function addParent(data: {
  displayName: string;
  email: string;
  studentIds: string[];
  password?: string;
}) {
  await requireStaff();

  if (!data.displayName.trim()) throw new Error("Parent name is required");
  if (!data.email.includes("@")) throw new Error("Invalid email address");
  if (data.studentIds.length === 0) throw new Error("Link at least one student");

  const supabase = await createClient();
  const { data: existing } = await supabase.from("parents").select("id").eq("email", data.email).maybeSingle();
  if (existing) throw new Error("A parent with this email already exists");

  const tempPassword = data.password ?? `${BRAND.studentIdPrefix}-${crypto.randomUUID().slice(0, 8)}`;
  const user = await signUpWithRole(data.email, tempPassword, data.displayName, "parent");
  if (!user) throw new Error("Failed to create parent account");

  const { data: parent, error } = await supabase
    .from("parents")
    .insert({
      user_id: user.id,
      display_name: data.displayName,
      email: data.email,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const links = data.studentIds.map((studentId) => ({
    parent_id: parent.id,
    student_id: studentId,
  }));

  const { error: linkError } = await supabase.from("parent_student_links").insert(links);
  if (linkError) throw new Error(linkError.message);

  await sendStudentWelcomeEmail({
    displayName: data.displayName,
    studentId: "Parent",
    email: data.email,
    tempPassword,
    courseName: "Parent Portal",
  });

  await logAdminAction("parent.create", "parent", parent.id, { studentIds: data.studentIds });

  revalidatePath("/admin/parents");
  return { id: parent.id, tempPassword: data.password ? undefined : tempPassword };
}
