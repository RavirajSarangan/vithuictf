import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";

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

  // RLS: visible to the owning student, their parent, or staff on the batch.
  const { data: submission, error } = await supabase
    .from("assignment_submissions")
    .select("id, file_path, file_name")
    .eq("id", id)
    .maybeSingle();

  if (error || !submission || !submission.file_path) {
    return NextResponse.json({ error: "Submission file not found" }, { status: 404 });
  }

  if (!isAdminClientConfigured()) {
    return NextResponse.json({ error: "File storage not configured" }, { status: 500 });
  }

  const admin = createAdminClient();
  const { data: signed, error: signError } = await admin.storage
    .from("submissions")
    .createSignedUrl(submission.file_path, 300, {
      download: submission.file_name ?? undefined,
    });

  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: "Failed to generate secure URL" }, { status: 500 });
  }

  return NextResponse.json({
    id: submission.id,
    fileName: submission.file_name,
    url: signed.signedUrl,
    expiresIn: 300,
  });
}
