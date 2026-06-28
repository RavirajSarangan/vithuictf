"use server";

import { syncAllStaffPortalAccounts, type StaffPortalSyncResult } from "@/lib/staff-portal-sync";
import { isAdminClientConfigured } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/actions/auth";

/** Admin-only: repair staff usernames and profile roles (People page). */
export async function autoSyncStaffPortalAccounts(): Promise<StaffPortalSyncResult> {
  await requireAdmin();
  return syncAllStaffPortalAccounts();
}

/** Login path: repair staff records before sign-in when any account needs it. */
export async function autoSyncStaffPortalAccountsForLogin(): Promise<void> {
  if (!isAdminClientConfigured()) return;

  const admin = (await import("@/lib/supabase/admin")).createAdminClient();
  const { data: teachers } = await admin
    .from("teachers")
    .select("staff_username, active")
    .limit(100);

  const needsUsernameRepair = (teachers ?? []).some((teacher) => {
    if (teacher.active === false) return false;
    const username = teacher.staff_username?.trim().toLowerCase() ?? "";
    return !username || !/^[a-z0-9_]{3,20}$/.test(username);
  });

  if (!needsUsernameRepair) return;

  await syncAllStaffPortalAccounts();
}
