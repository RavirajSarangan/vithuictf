"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionProfile, requireSuperAdmin, type StaffFeatureKey } from "@/lib/actions/auth";
import { actionFailure, type ActionResult, type DataActionResult } from "@/lib/actions/action-result";
import { safeRevalidatePath } from "@/lib/safe-revalidate";

export const STAFF_FEATURE_KEYS: StaffFeatureKey[] = [
  "quizzes_exams",
  "assignments",
  "attendance_students",
  "announcements_report_cards",
  "blog",
];

export const STAFF_FEATURE_LABELS: Record<StaffFeatureKey, string> = {
  quizzes_exams: "Quizzes & Exams",
  assignments: "Assignments",
  attendance_students: "Attendance & Students",
  announcements_report_cards: "Announcements & Report cards",
  blog: "Blog",
};

/**
 * Super admin read: full toggle state for one teacher, defaulting every
 * feature to `true` (allowed) unless an explicit disabling row exists.
 */
export async function getStaffFeaturePermissions(
  userId: string
): Promise<DataActionResult<Record<StaffFeatureKey, boolean>>> {
  try {
    await requireSuperAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("staff_feature_permissions")
      .select("feature_key, enabled")
      .eq("user_id", userId);
    if (error) return actionFailure(error, "Failed to load feature access");

    const result = Object.fromEntries(STAFF_FEATURE_KEYS.map((key) => [key, true])) as Record<
      StaffFeatureKey,
      boolean
    >;
    for (const row of data ?? []) {
      result[row.feature_key as StaffFeatureKey] = row.enabled;
    }
    return { ok: true, data: result };
  } catch (error) {
    return actionFailure(error, "Failed to load feature access");
  }
}

/** Own read: the calling teacher's toggle state, for nav hiding. */
export async function getMyFeaturePermissions(): Promise<Record<StaffFeatureKey, boolean>> {
  const profile = await getSessionProfile();
  const result = Object.fromEntries(STAFF_FEATURE_KEYS.map((key) => [key, true])) as Record<
    StaffFeatureKey,
    boolean
  >;
  if (!profile || (profile.role !== "teacher" && profile.role !== "faculty_staff")) return result;

  const supabase = await createClient();
  const { data } = await supabase
    .from("staff_feature_permissions")
    .select("feature_key, enabled")
    .eq("user_id", profile.id);

  for (const row of data ?? []) {
    result[row.feature_key as StaffFeatureKey] = row.enabled;
  }
  return result;
}

/**
 * Super admin write: reconcile toggle state for one teacher. Re-enabling a
 * feature deletes its row entirely (rather than flipping enabled:true) so
 * "no row" stays the single source of truth for "allowed."
 */
export async function updateStaffFeaturePermissions(
  userId: string,
  permissions: Record<StaffFeatureKey, boolean>
): Promise<ActionResult> {
  try {
    await requireSuperAdmin();
    const supabase = await createClient();

    const disabledKeys = STAFF_FEATURE_KEYS.filter((key) => permissions[key] === false);
    const enabledKeys = STAFF_FEATURE_KEYS.filter((key) => permissions[key] !== false);

    if (enabledKeys.length) {
      const { error } = await supabase
        .from("staff_feature_permissions")
        .delete()
        .eq("user_id", userId)
        .in("feature_key", enabledKeys);
      if (error) return actionFailure(error, "Failed to update feature access");
    }

    if (disabledKeys.length) {
      const rows = disabledKeys.map((feature_key) => ({ user_id: userId, feature_key, enabled: false }));
      const { error } = await supabase
        .from("staff_feature_permissions")
        .upsert(rows, { onConflict: "user_id,feature_key" });
      if (error) return actionFailure(error, "Failed to update feature access");
    }

    safeRevalidatePath("/admin/people");
    return { ok: true };
  } catch (error) {
    return actionFailure(error, "Failed to update feature access");
  }
}
