"use client";

import { StudentBatchCalendar } from "@/components/student/student-batch-calendar";
import {
  StudentPageHeader,
  StudentPageLoading,
} from "@/components/student/portal/student-portal-states";
import { useActiveCourseId, useActiveCourseName } from "@/contexts/student-course-context";
import { useStudentBatchCalendarSessions } from "@/hooks/use-academics";
import { useStudentData } from "@/hooks/use-data";

export default function StudentCalendarPage() {
  const student = useStudentData();
  const activeCourseId = useActiveCourseId(student?.courseId);
  const activeCourseName = useActiveCourseName(student?.courseName);
  const { data: batchSessions, loading } = useStudentBatchCalendarSessions(
    student?.id ?? null,
    activeCourseId
  );

  if (student === undefined || loading) {
    return <StudentPageLoading rows={2} />;
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-6">
      <StudentPageHeader
        title="Calendar"
        description={
          activeCourseName
            ? `Batch class schedule for ${activeCourseName}.`
            : "View your weekly batch class schedule."
        }
      />
      <StudentBatchCalendar sessions={batchSessions} loading={loading} />
    </div>
  );
}
