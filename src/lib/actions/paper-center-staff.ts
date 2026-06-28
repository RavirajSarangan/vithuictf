"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin, signUpWithRole } from "@/lib/actions/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { BRAND } from "@/lib/constants";
import { actionFailure, formatAccountRole, type ActionResult } from "@/lib/actions/action-result";
import { isAdminClientConfigured } from "@/lib/supabase/admin";
import { normalizeStaffUsername } from "@/lib/staff-username";
import { USERNAME_PATTERN } from "@/lib/validation/register-student";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function addPaperCenterStaff(data: {
  displayName: string;
  staffUsername: string;
  email: string;
  paperCenterId: string;
  password?: string;
}): Promise<ActionResult<{ tempPassword?: string; loginUrl?: string }>> {
  try {
    await requireSuperAdmin();

    if (!isAdminClientConfigured()) {
      return {
        ok: false,
        error: "Account creation is not configured. Contact support to set up the service role key.",
      };
    }

    if (!data.displayName.trim()) return { ok: false, error: "Name is required" };
    if (!isValidEmail(data.email)) return { ok: false, error: "Invalid email address" };
    if (!data.paperCenterId) return { ok: false, error: "Paper center is required" };

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
      .from("paper_center_staff")
      .select("id")
      .ilike("staff_username", normalizedUsername)
      .maybeSingle();

    if (existingUsername) {
      return { ok: false, error: "This username is already in use" };
    }

    const { data: center } = await supabase
      .from("paper_centers")
      .select("id, is_active, slug")
      .eq("id", data.paperCenterId)
      .maybeSingle();

    if (!center?.is_active) {
      return { ok: false, error: "Selected paper center is not available" };
    }

    const tempPassword = data.password ?? `ICTF-${crypto.randomUUID().slice(0, 8)}`;
    const user = await signUpWithRole(
      normalizedEmail,
      tempPassword,
      data.displayName,
      "paper_center_staff"
    );
    if (!user) return { ok: false, error: "Failed to create auth user" };

    const { error } = await supabase.from("paper_center_staff").insert({
      user_id: user.id,
      paper_center_id: data.paperCenterId,
      display_name: data.displayName.trim(),
      staff_username: normalizedUsername,
      email: normalizedEmail,
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
    const loginUrl = center?.slug ? `/login/paper-center/${center.slug}` : "/login/paper-center";
    return { ok: true, tempPassword: data.password ? undefined : tempPassword, loginUrl };
  } catch (error) {
    return actionFailure(error, "Failed to add paper center staff");
  }
}

export async function setPaperCenterStaffActive(id: string, active: boolean) {
  await requireSuperAdmin();
  const supabase = await createClient();

  const { data: staff, error } = await supabase
    .from("paper_center_staff")
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

export async function deletePaperCenterStaff(id: string) {
  await requireSuperAdmin();
  const supabase = await createClient();

  const { data: staff } = await supabase
    .from("paper_center_staff")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("paper_center_staff").delete().eq("id", id);
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

export async function resetPaperCenterStaffPassword(id: string, newPassword?: string) {
  await requireSuperAdmin();

  const supabase = await createClient();
  const { data: staff } = await supabase
    .from("paper_center_staff")
    .select("user_id, display_name, email")
    .eq("id", id)
    .maybeSingle();

  if (!staff) throw new Error("Paper center staff member not found");

  const tempPassword = newPassword ?? `${BRAND.studentIdPrefix}-${crypto.randomUUID().slice(0, 8)}`;
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(staff.user_id, {
    password: tempPassword,
  });
  if (error) throw new Error(error.message);

  return { tempPassword: newPassword ? undefined : tempPassword, email: staff.email };
}
