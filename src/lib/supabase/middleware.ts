import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import type { UserRole } from "@/types";

const VALID_ROLES = new Set<UserRole>([
  "student",
  "parent",
  "teacher",
  "admin",
  "super_admin",
  "content_manager",
  "paper_center_staff",
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

  return { supabaseResponse, user, role };
}
