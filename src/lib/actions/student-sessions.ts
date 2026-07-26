"use server";

import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getRequestClientKey } from "@/lib/security/request-client-key";
import { parseUserAgent } from "@/lib/security/user-agent";
import { STUDENT_SESSION_COOKIE } from "@/lib/security/student-session-cookie";
import { requireAdmin, requireStaff } from "@/lib/actions/auth";
import type { Database } from "@/types/database";

type StudentSessionRow = Database["public"]["Tables"]["student_sessions"]["Row"];

const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

/** Rotates the student's active session: revokes any prior row, inserts a new one, sets the marker cookie. */
export async function createStudentSessionOnLogin(
  userId: string,
  studentRowId: string | null
): Promise<void> {
  if (!isAdminClientConfigured()) return;

  try {
    const marker = crypto.randomUUID();
    const headerStore = await headers();
    const ip = await getRequestClientKey();
    const userAgent = headerStore.get("user-agent");
    const deviceLabel = parseUserAgent(userAgent);

    const admin = createAdminClient();
    await admin
      .from("student_sessions")
      .update({ revoked_at: new Date().toISOString(), revoked_reason: "new_login" })
      .eq("user_id", userId)
      .is("revoked_at", null);

    const { error } = await admin.from("student_sessions").insert({
      user_id: userId,
      student_row_id: studentRowId,
      session_marker: marker,
      ip_address: ip,
      user_agent: userAgent,
      device_label: deviceLabel,
    });

    if (error) throw error;

    (await cookies()).set(STUDENT_SESSION_COOKIE, marker, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_COOKIE_MAX_AGE,
    });
  } catch (err) {
    // Session tracking is a hardening feature — a write failure here must
    // never block an otherwise-valid login.
    console.error("[createStudentSessionOnLogin]", err);
  }
}

/** Revokes the caller's own active session row on voluntary logout. */
export async function revokeCurrentStudentSession(): Promise<void> {
  if (!isAdminClientConfigured()) return;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const cookieStore = await cookies();
    const marker = cookieStore.get(STUDENT_SESSION_COOKIE)?.value;

    if (user) {
      const admin = createAdminClient();
      await admin
        .from("student_sessions")
        .update({ revoked_at: new Date().toISOString(), revoked_reason: "manual_logout" })
        .eq("user_id", user.id)
        .is("revoked_at", null);
    }

    if (marker) {
      cookieStore.delete(STUDENT_SESSION_COOKIE);
    }
  } catch (err) {
    console.error("[revokeCurrentStudentSession]", err);
  }
}

/** Admin-triggered force-logout of a specific session row. */
export async function forceLogoutStudentSession(sessionId: string): Promise<void> {
  await requireAdmin();

  const admin = createAdminClient();
  const { error } = await admin
    .from("student_sessions")
    .update({ revoked_at: new Date().toISOString(), revoked_reason: "admin_force" })
    .eq("id", sessionId)
    .is("revoked_at", null);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/students/[id]", "page");
}

/** Login/session history for the admin student detail panel. Omits session_marker — never expose the token itself. */
export async function getStudentSessionHistory(
  studentRowId: string
): Promise<Omit<StudentSessionRow, "session_marker">[]> {
  await requireStaff();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("student_sessions")
    .select("id, user_id, student_row_id, ip_address, user_agent, device_label, created_at, last_seen_at, revoked_at, revoked_reason")
    .eq("student_row_id", studentRowId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);
  return data ?? [];
}
