import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

const STAFF_ROLES: UserRole[] = ["teacher", "admin", "super_admin", "content_manager"];

export async function requireApiUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401 as const, error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    ok: true as const,
    supabase,
    user,
    role: (profile?.role as UserRole | undefined) ?? null,
  };
}

export async function requireApiStaff() {
  const session = await requireApiUser();
  if (!session.ok) return session;

  if (!session.role || !STAFF_ROLES.includes(session.role)) {
    return { ok: false as const, status: 403 as const, error: "Forbidden" };
  }

  return session;
}
