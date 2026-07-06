import { pdf } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { assembleBatchReportCards } from "@/lib/report-cards/data";
import { ReportCardDocument } from "@/components/report-cards/report-card-document";
import { BRAND } from "@/lib/constants";

export const runtime = "nodejs";

const STAFF_ROLES = new Set(["teacher", "admin", "super_admin"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  const batchId = searchParams.get("batchId");
  const term = searchParams.get("term");
  if (!studentId || !batchId || !term) {
    return new Response("studentId, batchId and term are required", { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isStaff = STAFF_ROLES.has(profile?.role ?? "");

  if (!isStaff) {
    // Students may fetch their own card, parents a linked child's — and only
    // once the batch/term is published.
    const { data: student } = await supabase
      .from("students")
      .select("id, user_id")
      .eq("id", studentId)
      .maybeSingle();
    if (!student) return new Response("Forbidden", { status: 403 });

    let allowed = student.user_id === user.id;
    if (!allowed && profile?.role === "parent") {
      const { data: parent } = await supabase
        .from("parents")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (parent) {
        const { data: link } = await supabase
          .from("parent_student_links")
          .select("student_id")
          .eq("parent_id", parent.id)
          .eq("student_id", studentId)
          .maybeSingle();
        allowed = Boolean(link);
      }
    }
    if (!allowed) return new Response("Forbidden", { status: 403 });

    const { data: publication } = await supabase
      .from("report_card_publications")
      .select("id")
      .eq("batch_id", batchId)
      .eq("term", term)
      .maybeSingle();
    if (!publication) return new Response("Report card is not published yet", { status: 403 });
  }

  // Assembly needs batch-wide marks for the rank, which a student-scoped RLS
  // client cannot see — use the admin client after the checks above.
  const dataClient = isAdminClientConfigured() ? createAdminClient() : supabase;
  const batch = await assembleBatchReportCards(dataClient, batchId, term);
  if (!batch) return new Response("Batch not found", { status: 404 });
  if (!batch.exams.length) return new Response("No published exams for this term", { status: 404 });

  const student = batch.students.find((s) => s.studentId === studentId);
  if (!student) return new Response("Student is not in this batch", { status: 404 });

  const blob = await pdf(
    <ReportCardDocument brandName={BRAND.name} batch={batch} student={student} />
  ).toBlob();

  const safeTerm = term.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
  return new Response(blob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="report-card-${safeTerm}-${studentId}.pdf"`,
    },
  });
}
