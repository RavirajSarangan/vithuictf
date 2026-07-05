"use client";

import { useStudentData } from "@/hooks/use-data";
import { useStudentAssignments } from "@/hooks/use-student-data";
import { StudentAssignmentsView } from "@/components/student/assignments/student-assignments-view";
import {
  StudentPageHeader,
  StudentPageLoading,
} from "@/components/student/portal/student-portal-states";

export default function StudentAssignmentsPage() {
  const student = useStudentData();
  const { assignments, loading, refresh } = useStudentAssignments(student?.id);

  if (student === undefined || loading) {
    return <StudentPageLoading rows={2} />;
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-6">
      <StudentPageHeader
        title="Assignments"
        description="Homework from your batches — submit your work and see marks and feedback."
      />
      <StudentAssignmentsView assignments={assignments} onRefresh={refresh} />
    </div>
  );
}
