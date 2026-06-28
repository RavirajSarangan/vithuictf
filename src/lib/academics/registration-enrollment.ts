import type { createAdminClient } from "@/lib/supabase/admin";
import type { createClient } from "@/lib/supabase/server";
import type { RegisterStudentInput } from "@/lib/validation/register-student";

type DbClient =
  | ReturnType<typeof createAdminClient>
  | Awaited<ReturnType<typeof createClient>>;

type RegistrationBatchRow = {
  id: string;
  name: string;
  batch_code: string;
  start_date: string;
};

export async function nextEnrollmentCode(
  supabase: DbClient,
  batchCode: string
): Promise<string> {
  const prefix = `${batchCode}-`;
  const { data } = await supabase
    .from("batch_enrollments")
    .select("enrollment_code")
    .like("enrollment_code", `${prefix}%`)
    .order("enrollment_code", { ascending: false })
    .limit(1);

  const last = data?.[0]?.enrollment_code;
  const lastSeq = last ? parseInt(last.split("-").pop() ?? "0", 10) : 0;
  return `${prefix}${String(lastSeq + 1).padStart(3, "0")}`;
}

export async function findRegistrationBatchForCourse(
  supabase: DbClient,
  courseId: string,
  studentMeta: Pick<RegisterStudentInput, "studyTrack" | "examYear" | "ictGrade">
): Promise<string | null> {
  const { data: batches } = await supabase
    .from("course_batches")
    .select("id, name, batch_code, start_date")
    .eq("course_id", courseId)
    .eq("active", true)
    .order("start_date", { ascending: false });

  const rows = (batches ?? []) as RegistrationBatchRow[];
  if (rows.length === 0) return null;
  if (rows.length === 1) return rows[0].id;

  if (studentMeta.studyTrack === "al" && studentMeta.examYear) {
    const yearMatch = rows.find(
      (batch) =>
        batch.name.includes(studentMeta.examYear!) ||
        batch.batch_code.includes(studentMeta.examYear!)
    );
    if (yearMatch) return yearMatch.id;
  }

  if (studentMeta.studyTrack === "grade" && studentMeta.ictGrade) {
    const gradeToken = studentMeta.ictGrade === "grade_10" ? "10" : "11";
    const gradeMatch = rows.find((batch) =>
      new RegExp(`grade\\s*${gradeToken}|g${gradeToken}|தரம்\\s*${gradeToken}`, "i").test(
        batch.name
      )
    );
    if (gradeMatch) return gradeMatch.id;
  }

  return rows[0]?.id ?? null;
}

export async function enrollStudentInBatchWithClient(
  supabase: DbClient,
  batchId: string,
  studentUuid: string
): Promise<{ enrolled: boolean; enrollmentId?: string; enrollmentCode?: string }> {
  const { data: batch } = await supabase
    .from("course_batches")
    .select("batch_code, active")
    .eq("id", batchId)
    .maybeSingle();
  if (!batch?.active) return { enrolled: false };

  const { data: existing } = await supabase
    .from("batch_enrollments")
    .select("id, enrollment_code, active")
    .eq("batch_id", batchId)
    .eq("student_id", studentUuid)
    .maybeSingle();

  if (existing) {
    if (!existing.active) {
      await supabase.from("batch_enrollments").update({ active: true }).eq("id", existing.id);
    }
    return {
      enrolled: true,
      enrollmentId: existing.id,
      enrollmentCode: existing.enrollment_code,
    };
  }

  const enrollmentCode = await nextEnrollmentCode(supabase, batch.batch_code);
  const { data, error } = await supabase
    .from("batch_enrollments")
    .insert({
      batch_id: batchId,
      student_id: studentUuid,
      enrollment_code: enrollmentCode,
    })
    .select("id, enrollment_code")
    .single();

  if (error) {
    if (error.code === "23505") return { enrolled: false };
    throw new Error(error.message);
  }

  return {
    enrolled: true,
    enrollmentId: data.id,
    enrollmentCode: data.enrollment_code,
  };
}

/** Enroll a newly registered student in the best matching active batch for their course. */
export async function autoEnrollStudentOnRegistration(
  supabase: DbClient,
  studentUuid: string,
  courseId: string,
  studentMeta: RegisterStudentInput
): Promise<void> {
  const batchId = await findRegistrationBatchForCourse(supabase, courseId, studentMeta);
  if (!batchId) return;
  await enrollStudentInBatchWithClient(supabase, batchId, studentUuid);
}

export function assertCourseMatchesStudyTrack(
  courseLevel: string,
  studyTrack: RegisterStudentInput["studyTrack"]
): void {
  const expectedLevel = studyTrack === "al" ? "AL" : "OL";
  if (courseLevel !== expectedLevel) {
    throw new Error("Selected course does not match your study program");
  }
}
