"use client";

import { useStudentData } from "@/hooks/use-data";
import { useStudentBatchAttendance } from "@/hooks/use-academics";
import { useActiveCourseName } from "@/contexts/student-course-context";
import { StudentAttendanceView } from "@/components/academics/student-attendance-view";
import {
  StudentPageHeader,
  StudentPageLoading,
} from "@/components/student/portal/student-portal-states";

export default function StudentAttendancePage() {
  const student = useStudentData();
  const activeCourseName = useActiveCourseName(student?.courseName);
  const { data: batches, loading } = useStudentBatchAttendance(student?.id ?? null);

  if (student === undefined || loading) {
    return <StudentPageLoading rows={2} />;
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-6">
      <StudentPageHeader
        title="Attendance"
        description={
          activeCourseName
            ? `Your class attendance across enrolled batches. Currently viewing ${activeCourseName}.`
            : "View your class attendance history."
        }
      />
      <StudentAttendanceView batches={batches} />
    </div>
  );
}
