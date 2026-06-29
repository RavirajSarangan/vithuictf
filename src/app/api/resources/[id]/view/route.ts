import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getRequestClientKey } from "@/lib/security/request-client-key";

const STAFF_ROLES = new Set(["teacher", "admin", "super_admin", "content_manager"]);

async function userCanAccessResourceCourse(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  courseId: string | null
): Promise<boolean> {
  if (!courseId) return true;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role && STAFF_ROLES.has(profile.role)) return true;

  const { data: student } = await supabase
    .from("students")
    .select("id, course_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!student) return false;
  if (student.course_id === courseId) return true;

  const { data: enrollments } = await supabase
    .from("batch_enrollments")
    .select("course_batches(course_id)")
    .eq("student_id", student.id)
    .eq("active", true);

  return (enrollments ?? []).some((row) => {
    const batch = row.course_batches as { course_id?: string } | { course_id?: string }[] | null;
    const course = Array.isArray(batch) ? batch[0] : batch;
    return course?.course_id === courseId;
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: resource, error } = await supabase
    .from("resources")
    .select("id, title, storage_path, view_only, type, course_id")
    .eq("id", id)
    .single();

  if (error || !resource) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  const row = resource as {
    id: string;
    title: string;
    storage_path: string;
    view_only: boolean;
    type: string;
    course_id: string | null;
  };

  const allowed = await userCanAccessResourceCourse(supabase, user.id, row.course_id);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isAdminClientConfigured()) {
    return NextResponse.json({
      id: row.id,
      title: row.title,
      viewUrl: row.storage_path,
      viewOnly: row.view_only,
      expiresIn: 300,
    });
  }

  const admin = createAdminClient();
  const { data: signed, error: signError } = await admin.storage
    .from("resources")
    .createSignedUrl(row.storage_path, 300);

  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: "Failed to generate secure URL" }, { status: 500 });
  }

  return NextResponse.json({
    id: row.id,
    title: row.title,
    type: row.type,
    viewUrl: signed.signedUrl,
    viewOnly: row.view_only,
    expiresIn: 300,
  });
}
