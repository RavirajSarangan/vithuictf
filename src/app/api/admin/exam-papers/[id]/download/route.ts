import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "super_admin") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { data: submission } = await supabase
    .from("exam_paper_submissions")
    .select("storage_path, file_name, mime_type")
    .eq("id", id)
    .maybeSingle();

  if (!submission?.storage_path) {
    return new NextResponse("Not found", { status: 404 });
  }

  const admin = createAdminClient();
  const { data: file, error } = await admin.storage.from("exam-papers").download(submission.storage_path);
  if (error || !file) {
    return new NextResponse("Failed to load file", { status: 500 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = submission.file_name || "exam-paper";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": submission.mime_type || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
