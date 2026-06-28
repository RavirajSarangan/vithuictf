"use client";

import { useState } from "react";
import { useParentData } from "@/hooks/use-data";
import { useStudentBatchAttendance } from "@/hooks/use-academics";
import { StudentAttendanceView } from "@/components/academics/student-attendance-view";
import { StudentPageLoading } from "@/components/student/portal/student-portal-states";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ParentAttendancePage() {
  const { children, loading: parentLoading } = useParentData();
  const [selectedId, setSelectedId] = useState(children[0]?.id ?? "");
  const { data: batches, loading: attendanceLoading } = useStudentBatchAttendance(
    selectedId || null
  );

  if (parentLoading) return <StudentPageLoading rows={2} />;
  if (children.length === 0) {
    return <p className="text-icvf-text-light">No linked children found.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Attendance</h1>
        <p className="text-sm text-white/70">Class attendance for your child</p>
      </div>

      <Select value={selectedId} onValueChange={(v) => v && setSelectedId(v)}>
        <SelectTrigger className="w-64">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {children.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <StudentAttendanceView
        batches={batches}
        loading={attendanceLoading}
        emptyMessage="No batch enrollments found for this student."
      />
    </div>
  );
}
