"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin, signUpWithRole } from "@/lib/actions/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { BRAND } from "@/lib/constants";
import { actionFailure, formatAccountRole, type ActionResult } from "@/lib/actions/action-result";
import { isAdminClientConfigured } from "@/lib/supabase/admin";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function addContentManager(data: {
  displayName: string;
  email: string;
  password?: string;
}): Promise<ActionResult<{ tempPassword?: string }>> {
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

    const { data: existing } = await supabase
      .from("content_managers")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existing) {
      return { ok: false, error: "A content team member with this email already exists" };
    }

    const tempPassword = data.password ?? `ICTF-${crypto.randomUUID().slice(0, 8)}`;
    const user = await signUpWithRole(normalizedEmail, tempPassword, data.displayName, "content_manager");
    if (!user) return { ok: false, error: "Failed to create auth user" };

    const { error } = await supabase.from("content_managers").insert({
      user_id: user.id,
      display_name: data.displayName.trim(),
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
    revalidatePath("/admin/content-team");
    return { ok: true, tempPassword: data.password ? undefined : tempPassword };
  } catch (error) {
    return actionFailure(error, "Failed to add content team member");
  }
}

export async function setContentManagerActive(id: string, active: boolean) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: manager, error } = await supabase
    .from("content_managers")
    .update({ active })
    .eq("id", id)
    .select("user_id")
    .single();

  if (error) throw new Error(error.message);

  try {
    const admin = createAdminClient();
    if (active) {
      await admin.auth.admin.updateUserById(manager.user_id, { ban_duration: "none" });
    } else {
      await admin.auth.admin.updateUserById(manager.user_id, { ban_duration: "876000h" });
    }
  } catch {
    // Ban API may fail in dev without service role — row-level active flag still applies
  }

  revalidatePath("/admin/people");
  revalidatePath("/admin/content-team");
}

export async function deleteContentManager(id: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: manager } = await supabase
    .from("content_managers")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("content_managers").delete().eq("id", id);
  if (error) throw new Error(error.message);

  if (manager?.user_id) {
    try {
      const admin = createAdminClient();
      await admin.auth.admin.deleteUser(manager.user_id);
    } catch {
      // Profile cascade may still remove linked data
    }
  }

  revalidatePath("/admin/people");
  revalidatePath("/admin/content-team");
}

export async function resetContentManagerPassword(id: string, newPassword?: string) {
  await requireAdmin();

  const supabase = await createClient();
  const { data: manager } = await supabase
    .from("content_managers")
    .select("user_id, display_name, email")
    .eq("id", id)
    .maybeSingle();

  if (!manager) throw new Error("Content team member not found");

  const tempPassword = newPassword ?? `${BRAND.studentIdPrefix}-${crypto.randomUUID().slice(0, 8)}`;
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(manager.user_id, {
    password: tempPassword,
  });
  if (error) throw new Error(error.message);

  return { tempPassword: newPassword ? undefined : tempPassword, email: manager.email };
}
