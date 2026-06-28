import type { Student, Teacher, UserRole } from "@/types";

/** Filter students visible to a teacher based on assigned course IDs. */
export function filterStudentsForTeacher(
  students: Student[],
  role: UserRole | undefined,
  teacher: Pick<Teacher, "courseIds"> | null | undefined
): Student[] {
  if (role !== "teacher" || !teacher?.courseIds?.length) {
    return students;
  }
  const allowed = new Set(teacher.courseIds);
  return students.filter((s) => allowed.has(s.courseId));
}

/** Filter batches by teacher course scope. */
export function filterBatchesForTeacher<T extends { courseId: string }>(
  batches: T[],
  role: UserRole | undefined,
  teacher: Pick<Teacher, "courseIds"> | null | undefined
): T[] {
  if (role !== "teacher" || !teacher?.courseIds?.length) {
    return batches;
  }
  const allowed = new Set(teacher.courseIds);
  return batches.filter((b) => allowed.has(b.courseId));
}
