import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const part = new URL(request.url).searchParams.get("part") === "mcq" ? "mcq" : "written";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // RLS: only staff on the exam's course or enrolled students/parents see the row.
  const { data: exam, error } = await supabase
    .from("exams")
    .select(
      "id, title, written_question_paper_path, written_question_paper_name, mcq_question_paper_path, mcq_question_paper_name"
    )
    .eq("id", id)
    .eq("is_online_exam", true)
    .maybeSingle();

  const path = part === "mcq" ? exam?.mcq_question_paper_path : exam?.written_question_paper_path;
  const fileName = part === "mcq" ? exam?.mcq_question_paper_name : exam?.written_question_paper_name;

  if (error || !exam || !path) {
    return NextResponse.json({ error: "Question paper not found" }, { status: 404 });
  }

  if (!isAdminClientConfigured()) {
    return NextResponse.json({ error: "File storage not configured" }, { status: 500 });
  }

  const admin = createAdminClient();
  const { data: signed, error: signError } = await admin.storage
    .from("exam-question-papers")
    .createSignedUrl(path, 300);

  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: "Failed to generate secure URL" }, { status: 500 });
  }

  return NextResponse.json({
    id: exam.id,
    title: exam.title,
    fileName,
    url: signed.signedUrl,
    expiresIn: 300,
  });
}
