import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";

// Faculty-scoped counterpart to /api/assignments/[id]/file. The original
// route hardcodes `.from("assignments")`, which won't resolve faculty rows
// (those live in the fully separate `faculty_assignments` table), so this
// parallel route targets that table instead. The underlying storage bucket
// ("assignments") and signed-URL flow are identical — faculty attachment
// paths just carry a `faculty/` prefix within the same bucket.
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

  // RLS: only staff on the batch's course or enrolled students/parents see the row.
  const { data: assignment, error } = await supabase
    .from("faculty_assignments")
    .select("id, title, attachment_path, attachment_name")
    .eq("id", id)
    .maybeSingle();

  if (error || !assignment || !assignment.attachment_path) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }

  if (!isAdminClientConfigured()) {
    return NextResponse.json({ error: "File storage not configured" }, { status: 500 });
  }

  const admin = createAdminClient();
  const { data: signed, error: signError } = await admin.storage
    .from("assignments")
    .createSignedUrl(assignment.attachment_path, 300, {
      download: assignment.attachment_name ?? undefined,
    });

  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: "Failed to generate secure URL" }, { status: 500 });
  }

  return NextResponse.json({
    id: assignment.id,
    title: assignment.title,
    fileName: assignment.attachment_name,
    url: signed.signedUrl,
    expiresIn: 300,
  });
}
