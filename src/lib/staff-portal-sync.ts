import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { deriveStaffUsername } from "@/lib/staff-username";
import { USERNAME_PATTERN } from "@/lib/validation/register-student";

export type StaffPortalSyncResult = {
  usernamesBackfilled: number;
  profilesFixed: number;
  errors: string[];
};

function uniqueStaffUsername(base: string, used: Set<string>): string {
  let candidate = base;
  let suffix = 1;
  while (used.has(candidate) && suffix < 100) {
    candidate = `${base.slice(0, Math.max(3, 17 - String(suffix).length - 1))}_${suffix}`;
    suffix += 1;
  }
  used.add(candidate);
  return candidate;
}

/** Idempotent repair for missing staff usernames and mismatched profile roles. */
export async function syncAllStaffPortalAccounts(): Promise<StaffPortalSyncResult> {
  const result: StaffPortalSyncResult = {
    usernamesBackfilled: 0,
    profilesFixed: 0,
    errors: [],
  };

  if (!isAdminClientConfigured()) {
    return result;
  }

  const admin = createAdminClient();
  const { data: teachers, error } = await admin
    .from("teachers")
    .select("id, user_id, email, display_name, staff_username, active");

  if (error) {
    result.errors.push(error.message);
    return result;
  }

  const usedUsernames = new Set(
    (teachers ?? [])
      .map((teacher) => teacher.staff_username?.trim().toLowerCase())
      .filter((username): username is string => Boolean(username && USERNAME_PATTERN.test(username)))
  );

  for (const teacher of teachers ?? []) {
    if (teacher.active === false) continue;

    const currentUsername = teacher.staff_username?.trim().toLowerCase() ?? "";
    if (!currentUsername || !USERNAME_PATTERN.test(currentUsername)) {
      try {
        const base = deriveStaffUsername(teacher.email, teacher.display_name);
        const username = uniqueStaffUsername(base, usedUsernames);
        const { error: usernameError } = await admin
          .from("teachers")
          .update({ staff_username: username })
          .eq("id", teacher.id);

        if (usernameError) {
          result.errors.push(`${teacher.email}: ${usernameError.message}`);
          continue;
        }

        result.usernamesBackfilled += 1;
      } catch {
        result.errors.push(`${teacher.email}: could not derive staff username`);
        continue;
      }
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", teacher.user_id)
      .maybeSingle();

    if (!profile || profile.role === "teacher") continue;

    const { error: roleError } = await admin
      .from("profiles")
      .update({ role: "teacher" })
      .eq("id", teacher.user_id);

    if (roleError) {
      result.errors.push(`${teacher.email}: ${roleError.message}`);
      continue;
    }

    await admin.auth.admin.updateUserById(teacher.user_id, { app_metadata: { role: "teacher" } });
    result.profilesFixed += 1;
  }

  return result;
}
