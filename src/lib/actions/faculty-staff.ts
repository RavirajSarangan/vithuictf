"use server";

import crypto from "crypto";
import { safeRevalidatePath as revalidatePath } from "@/lib/safe-revalidate";
import { requireAdmin, signUpWithRole } from "@/lib/actions/auth";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { BRAND } from "@/lib/constants";
import { actionFailure, formatAccountRole, type ActionResult } from "@/lib/actions/action-result";
import { normalizeStaffUsername } from "@/lib/staff-username";
import { USERNAME_PATTERN } from "@/lib/validation/register-student";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function addFacultyStaff(data: {
  displayName: string;
  staffUsername: string;
  email: string;
  subjects: string[];
  courseIds: string[];
  password?: string;
}): Promise<ActionResult<{ tempPassword?: string; loginUrl?: string }>> {
  try {
    await requireAdmin();

    if (!isAdminClientConfigured()) {
      return {
        ok: false,
        error: "Account creation is not configured. Contact support to set up the service role key.",
      };
    }

    if (!data.displayName.trim()) return { ok: false, error: "Name is required" };
    if (!isValidEmail(data.email)) return { ok: false, error: "Invalid email address" };

    const normalizedUsername = normalizeStaffUsername(data.staffUsername);
    if (!normalizedUsername || !USERNAME_PATTERN.test(normalizedUsername)) {
      return { ok: false, error: "Use 3–20 letters, numbers, or underscores for username" };
    }

    const normalizedEmail = data.email.trim().toLowerCase();

    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: existingProfile } = await admin
      .from("profiles")
      .select("role")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingProfile) {
      return {
        ok: false,
        error: `This email is already registered as ${formatAccountRole(existingProfile.role)}.`,
      };
    }

    const { data: existingUsername } = await supabase
      .from("faculty_staff")
      .select("id")
      .ilike("staff_username", normalizedUsername)
      .maybeSingle();

    if (existingUsername) {
      return { ok: false, error: "This username is already in use" };
    }

    const tempPassword = data.password ?? `ICTF-${crypto.randomUUID().slice(0, 8)}`;
    const user = await signUpWithRole(
      normalizedEmail,
      tempPassword,
      data.displayName,
      "faculty_staff"
    );
    if (!user) return { ok: false, error: "Failed to create auth user" };

    const { error } = await supabase.from("faculty_staff").insert({
      user_id: user.id,
      display_name: data.displayName.trim(),
      staff_username: normalizedUsername,
      email: normalizedEmail,
      subjects: data.subjects,
      course_ids: data.courseIds,
      active: true,
    });

    if (error) {
      try {
        await admin.auth.admin.deleteUser(user.id);
      } catch {
        // Best-effort cleanup
      }
      return { ok: false, error: error.message };
    }

    revalidatePath("/admin/people");
    return { ok: true, tempPassword: data.password ? undefined : tempPassword, loginUrl: "/login/faculty" };
  } catch (error) {
    return actionFailure(error, "Failed to add faculty staff");
  }
}

export async function setFacultyStaffActive(id: string, active: boolean) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: staff, error } = await supabase
    .from("faculty_staff")
    .update({ active })
    .eq("id", id)
    .select("user_id")
    .single();

  if (error) throw new Error(error.message);

  if (!isAdminClientConfigured()) {
    if (!active) {
      throw new Error("Cannot deactivate staff: auth service is not configured.");
    }
  } else {
    const admin = createAdminClient();
    const { error: banError } = await admin.auth.admin.updateUserById(staff.user_id, {
      ban_duration: active ? "none" : "876000h",
    });
    if (banError) {
      throw new Error(active ? "Failed to restore staff login access." : "Failed to revoke staff login access.");
    }
  }

  revalidatePath("/admin/people");
}

export async function deleteFacultyStaff(id: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: staff } = await supabase
    .from("faculty_staff")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("faculty_staff").delete().eq("id", id);
  if (error) throw new Error(error.message);

  if (staff?.user_id) {
    try {
      const admin = createAdminClient();
      await admin.auth.admin.deleteUser(staff.user_id);
    } catch {
      // Profile cascade may still remove linked data
    }
  }

  revalidatePath("/admin/people");
}

export async function resetFacultyStaffPassword(id: string, newPassword?: string) {
  await requireAdmin();

  const supabase = await createClient();
  const { data: staff } = await supabase
    .from("faculty_staff")
    .select("user_id, display_name, email")
    .eq("id", id)
    .maybeSingle();

  if (!staff) throw new Error("Faculty staff member not found");

  const tempPassword = newPassword ?? `${BRAND.studentIdPrefix}-${crypto.randomUUID().slice(0, 8)}`;
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(staff.user_id, {
    password: tempPassword,
  });
  if (error) throw new Error(error.message);

  return { tempPassword: newPassword ? undefined : tempPassword, email: staff.email };
}

export async function updateFacultyStaff(
  id: string,
  data: { displayName: string; subjects: string[]; courseIds: string[] }
) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: staff, error } = await supabase
    .from("faculty_staff")
    .update({
      display_name: data.displayName.trim(),
      subjects: data.subjects,
      course_ids: data.courseIds,
    })
    .eq("id", id)
    .select("user_id")
    .single();

  if (error) throw new Error(error.message);

  await supabase
    .from("profiles")
    .update({ display_name: data.displayName.trim() })
    .eq("id", staff.user_id);

  revalidatePath("/admin/people");
}
