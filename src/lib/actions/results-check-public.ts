"use server";

// PUBLIC ACTION FILE — no requireStaff() anywhere here. Every query uses the
// service-role (admin) client directly, never the session-scoped client,
// because anonymous visitors calling checkStudentResult() have no session at
// all. Keep staff-only mutations in result-check-links.ts instead.

import { getActionErrorMessage } from "@/lib/action-error";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { getRequestClientKey } from "@/lib/security/request-client-key";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapResult } from "@/lib/supabase/mappers";
import { resultLookupSchema } from "@/lib/validation/result-check";
import type { Result } from "@/types";

type AdminClient = ReturnType<typeof createAdminClient>;

type ResultCheckLinkRow = {
  id: string;
  slug: string;
  course_id: string | null;
  course_name: string;
  status: string;
  lookup_count: number;
};

type StudentRow = {
  id: string;
  display_name: string;
  district: string | null;
  course_id: string | null;
  course_name: string;
  photo_url: string | null;
};

export type CheckStudentResultInput = {
  slug?: string;
  username: string;
  studentId: string;
  website?: string;
};

export type ResultLookupResponse =
  | {
      ok: true;
      student: { displayName: string; district: string | null; courseName: string; photoUrl: string | null };
      results: Result[];
    }
  | { ok: false; error: string };

// Never differentiate "wrong username" vs "wrong student ID" vs "not in this
// course" — a single generic message prevents enumerating valid usernames or
// student IDs one field at a time.
const GENERIC_NOT_FOUND = "No matching student found. Please double-check your username and student ID.";
const FEATURE_DISABLED = "Result checking is currently unavailable.";

async function isFeatureEnabled(admin: AdminClient): Promise<boolean> {
  const { data } = await admin.from("platform_settings").select("results_check_enabled").eq("id", 1).maybeSingle();
  return data?.results_check_enabled ?? false;
}

export async function checkStudentResult(input: CheckStudentResultInput): Promise<ResultLookupResponse> {
  const parsed = resultLookupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check your details and try again." };
  }
  const { slug, username, studentId } = parsed.data;

  const admin = createAdminClient();

  if (!(await isFeatureEnabled(admin))) {
    return { ok: false, error: FEATURE_DISABLED };
  }

  try {
    const ipKey = await getRequestClientKey();
    await assertRateLimit(`results-check:ip:${ipKey}`, 20, 3600);
    await assertRateLimit(
      `results-check:user:${username.toLowerCase()}`,
      8,
      3600,
      "Too many attempts for this account. Please try again later."
    );
  } catch (err) {
    return { ok: false, error: getActionErrorMessage(err, "Too many requests. Please try again later.") };
  }

  let link: ResultCheckLinkRow | null = null;
  if (slug) {
    const { data } = await admin
      .from("result_check_links")
      .select("id, slug, course_id, course_name, status, lookup_count")
      .eq("slug", slug)
      .maybeSingle();
    link = (data as ResultCheckLinkRow | null) ?? null;
    if (!link || link.status !== "active") {
      return { ok: false, error: GENERIC_NOT_FOUND };
    }
  }

  const { data: studentData } = await admin
    .from("students")
    .select("id, display_name, district, course_id, course_name, photo_url")
    .ilike("username", username)
    .ilike("student_id", studentId)
    .maybeSingle();

  const student = (studentData as StudentRow | null) ?? null;
  if (!student) {
    return { ok: false, error: GENERIC_NOT_FOUND };
  }

  if (link) {
    const matchesCourse = link.course_id
      ? student.course_id === link.course_id
      : student.course_name === link.course_name;
    if (!matchesCourse) {
      return { ok: false, error: GENERIC_NOT_FOUND };
    }
  }

  const { data: resultRows } = await admin
    .from("results")
    .select("*")
    .eq("student_id", student.id)
    .order("result_date", { ascending: false });

  const results = (resultRows ?? []).map((row) => mapResult(row as Parameters<typeof mapResult>[0]));

  if (link) {
    await admin
      .from("result_check_links")
      .update({ lookup_count: link.lookup_count + 1, updated_at: new Date().toISOString() })
      .eq("id", link.id);
  }

  return {
    ok: true,
    student: {
      displayName: student.display_name,
      district: student.district || null,
      courseName: student.course_name,
      photoUrl: student.photo_url,
    },
    results,
  };
}
