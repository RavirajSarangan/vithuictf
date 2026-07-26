import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import { STUDENT_SESSION_COOKIE } from "@/lib/security/student-session-cookie";
import type { UserRole } from "@/types";

const VALID_ROLES = new Set<UserRole>([
  "student",
  "parent",
  "teacher",
  "admin",
  "super_admin",
  "content_manager",
  "paper_center_staff",
  "faculty_staff",
]);

function readRoleFromJwt(appMetadata: Record<string, unknown> | undefined): UserRole | null {
  const role = appMetadata?.role;
  if (typeof role === "string" && VALID_ROLES.has(role as UserRole)) {
    return role as UserRole;
  }
  return null;
}

export async function updateSession(request: NextRequest, pathname?: string) {
  const requestHeaders = new Headers(request.headers);
  if (pathname) {
    requestHeaders.set("x-pathname", pathname);
  }

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  let role: UserRole | null = null;
  if (user) {
    const jwtRole = readRoleFromJwt(user.app_metadata as Record<string, unknown> | undefined);
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const profileRole =
      typeof profile?.role === "string" && VALID_ROLES.has(profile.role as UserRole)
        ? (profile.role as UserRole)
        : null;

    role = profileRole ?? jwtRole;
  }

  // Single active session enforcement — students only. A student's request
  // is only trusted if their session-marker cookie still matches the latest
  // unrevoked row in student_sessions (checked via a SECURITY DEFINER RPC
  // scoped to auth.uid(), since the table itself denies all client reads).
  //
  // A nil-UUID sentinel is always sent (even with no cookie) so every case
  // — including "table/RPC not migrated yet" — goes through one RPC call.
  // If the RPC errors (migration not applied, transient DB issue), this
  // fails OPEN: the feature is treated as not-yet-provisioned rather than
  // locking every student out on their very next request.
  let sessionReplaced = false;
  if (user && role === "student") {
    const marker = request.cookies.get(STUDENT_SESSION_COOKIE)?.value ||
      "00000000-0000-0000-0000-000000000000";
    const { data: active, error: rpcError } = await supabase.rpc("touch_student_session", {
      p_session_marker: marker,
    });

    if (rpcError) {
      console.error("[updateSession] touch_student_session RPC failed:", rpcError.message);
    } else if (!active) {
      sessionReplaced = true;
      role = null;
      supabaseResponse.cookies.delete(STUDENT_SESSION_COOKIE);
    }
  }

  // Per-teacher (and per-faculty-staff) feature toggles — fail open (empty =
  // nothing disabled) if the table isn't migrated yet or the query errors,
  // matching the same safety posture as the session check above.
  let disabledFeatures: string[] = [];
  if (user && (role === "teacher" || role === "faculty_staff")) {
    const { data: rows } = await supabase
      .from("staff_feature_permissions")
      .select("feature_key")
      .eq("user_id", user.id)
      .eq("enabled", false);
    disabledFeatures = (rows ?? []).map((row) => row.feature_key as string);
  }

  return {
    supabaseResponse,
    user: sessionReplaced ? null : user,
    role,
    sessionReplaced,
    disabledFeatures,
  };
}
