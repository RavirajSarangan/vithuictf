import type { RegistrationStatus, Student, StudentEnrollmentDetail } from "@/types";

export type StudentSearchFilters = {
  query?: string;
  courseId?: string;
  batchId?: string;
  registrationStatus?: RegistrationStatus | "all";
  accountStatus?: "active" | "disabled" | "all";
  enrollmentStatus?: "enrolled" | "not_enrolled" | "multi" | "all";
  examYear?: string;
};

export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

function matchesQuery(
  student: Student,
  enrollments: StudentEnrollmentDetail[],
  query: string
): boolean {
  if (!query) return true;
  const haystack = [
    student.displayName,
    student.email,
    student.studentId,
    student.indexNumber,
    student.nicNumber,
    student.phone,
    student.courseName,
    ...enrollments.map((e) => e.course.name),
    ...enrollments.map((e) => e.batch.batchCode),
    ...enrollments.map((e) => e.enrollmentCode),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export function filterStudentsWithEnrollments(
  rows: Array<{ student: Student; enrollments: StudentEnrollmentDetail[] }>,
  filters: StudentSearchFilters
): Array<{ student: Student; enrollments: StudentEnrollmentDetail[] }> {
  const query = normalizeSearchQuery(filters.query ?? "");

  return rows.filter(({ student, enrollments }) => {
    if (!matchesQuery(student, enrollments, query)) return false;

    if (filters.courseId && filters.courseId !== "all") {
      const inCourse =
        student.courseId === filters.courseId ||
        enrollments.some((e) => e.courseId === filters.courseId && e.active);
      if (!inCourse) return false;
    }

    if (filters.batchId && filters.batchId !== "all") {
      if (!enrollments.some((e) => e.batch.id === filters.batchId && e.active)) return false;
    }

    if (filters.registrationStatus && filters.registrationStatus !== "all") {
      if ((student.registrationStatus ?? "approved") !== filters.registrationStatus) return false;
    }

    if (filters.accountStatus && filters.accountStatus !== "all") {
      const isActive = student.active !== false;
      if (filters.accountStatus === "active" && !isActive) return false;
      if (filters.accountStatus === "disabled" && isActive) return false;
    }

    if (filters.enrollmentStatus && filters.enrollmentStatus !== "all") {
      const activeCount = enrollments.filter((e) => e.active).length;
      if (filters.enrollmentStatus === "enrolled" && activeCount === 0) return false;
      if (filters.enrollmentStatus === "not_enrolled" && activeCount > 0) return false;
      if (filters.enrollmentStatus === "multi" && activeCount < 2) return false;
    }

    if (filters.examYear && filters.examYear !== "all") {
      if (student.examYear !== filters.examYear) return false;
    }

    return true;
  });
}

export function parseStudentSearchParams(searchParams: URLSearchParams): StudentSearchFilters {
  return {
    query: searchParams.get("q") ?? undefined,
    courseId: searchParams.get("course") ?? undefined,
    batchId: searchParams.get("batch") ?? undefined,
    registrationStatus:
      (searchParams.get("reg") as RegistrationStatus | null) ?? undefined,
    accountStatus:
      (searchParams.get("account") as "active" | "disabled" | null) ?? undefined,
    enrollmentStatus:
      (searchParams.get("enroll") as "enrolled" | "not_enrolled" | "multi" | null) ?? undefined,
    examYear: searchParams.get("examYear") ?? undefined,
  };
}

export function studentSearchParamsToUrl(filters: StudentSearchFilters): string {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.courseId && filters.courseId !== "all") params.set("course", filters.courseId);
  if (filters.batchId && filters.batchId !== "all") params.set("batch", filters.batchId);
  if (filters.registrationStatus && filters.registrationStatus !== "all") {
    params.set("reg", filters.registrationStatus);
  }
  if (filters.accountStatus && filters.accountStatus !== "all") {
    params.set("account", filters.accountStatus);
  }
  if (filters.enrollmentStatus && filters.enrollmentStatus !== "all") {
    params.set("enroll", filters.enrollmentStatus);
  }
  if (filters.examYear && filters.examYear !== "all") params.set("examYear", filters.examYear);
  const str = params.toString();
  return str ? `?${str}` : "";
}

export function sortStudents(
  rows: Array<{ student: Student; enrollments: StudentEnrollmentDetail[] }>,
  sort: "name" | "newest" | "pending_first" = "name"
): Array<{ student: Student; enrollments: StudentEnrollmentDetail[] }> {
  const copy = [...rows];
  if (sort === "name") {
    copy.sort((a, b) => a.student.displayName.localeCompare(b.student.displayName));
  } else if (sort === "newest") {
    copy.sort((a, b) => {
      const aDate = a.student.createdAt ?? "";
      const bDate = b.student.createdAt ?? "";
      return bDate.localeCompare(aDate);
    });
  } else if (sort === "pending_first") {
    copy.sort((a, b) => {
      const aPending = (a.student.registrationStatus ?? "approved") === "pending" ? 0 : 1;
      const bPending = (b.student.registrationStatus ?? "approved") === "pending" ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;
      return a.student.displayName.localeCompare(b.student.displayName);
    });
  }
  return copy;
}
