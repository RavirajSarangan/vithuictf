"use client";

import { useCallback, useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { AdminTableSection } from "@/components/admin/admin-table-section";
import { useAcademicsStudents, useBatches, useEnrollmentOverview } from "@/hooks/use-academics";
import { useAdminCourses } from "@/hooks/use-data";
import { setStudentActive } from "@/lib/actions/academics";
import {
  studentListSummary,
  studentListSelectionInsights,
} from "@/lib/table-insights";
import { StudentSearchBar } from "@/components/academics/student-search-bar";
import { StudentUpdateDrawer } from "@/components/academics/student-update-drawer";
import { EnrollmentStatusBadge } from "@/components/academics/enrollment-status-badge";
import { getActionErrorMessage } from "@/lib/action-error";
import {
  filterStudentsWithEnrollments,
  sortStudents,
  type StudentSearchFilters,
} from "@/lib/academics/student-search";
import { useAuth } from "@/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import type { Student } from "@/types";
import { Pencil, Users } from "lucide-react";
import { toast } from "sonner";

export default function AcademicsStudentsPage() {
  const { data: students, loading, refresh } = useAcademicsStudents();
  const { data: overview, refresh: refreshOverview } = useEnrollmentOverview();
  const { data: courses } = useAdminCourses();
  const { data: batches } = useBatches();
  const { user } = useAuth();
  const [drawerStudent, setDrawerStudent] = useState<Student | null>(null);
  const [filters, setFilters] = useState<StudentSearchFilters>({});
  const canDisable = user?.role === "admin" || user?.role === "super_admin";

  const overviewRows = useMemo(() => {
    const ids = new Set(students.map((s) => s.id));
    return overview.filter((r) => ids.has(r.student.id));
  }, [overview, students]);

  const filteredRows = useMemo(() => {
    const rows = filterStudentsWithEnrollments(overviewRows, filters);
    return sortStudents(rows, "pending_first");
  }, [overviewRows, filters]);

  const filteredStudents = useMemo(
    () => filteredRows.map((r) => r.student),
    [filteredRows]
  );

  const summaryItems = useMemo(() => studentListSummary(filteredStudents), [filteredStudents]);

  const handleRefresh = () => {
    refresh();
    refreshOverview();
  };

  const handleBulkSetActive = useCallback(
    async (ids: string[], active: boolean) => {
      try {
        await Promise.all(ids.map((id) => setStudentActive(id, active)));
        handleRefresh();
        toast.success(`${active ? "Enabled" : "Disabled"} ${ids.length} student${ids.length === 1 ? "" : "s"}`);
      } catch (e) {
        toast.error(getActionErrorMessage(e, "Failed to update status"));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refresh, refreshOverview]
  );

  const toggleActive = async (student: Student) => {
    try {
      await setStudentActive(student.id, student.active === false);
      handleRefresh();
      toast.success(student.active === false ? "Student enabled" : "Student disabled");
    } catch (e) {
      toast.error(getActionErrorMessage(e, "Failed to update status"));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Students" description="Search, edit profiles, and manage enrollments" />

      <StudentSearchBar
        filters={filters}
        onChange={setFilters}
        courses={courses}
        batches={batches}
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading students…</p>
      ) : filteredRows.length === 0 ? (
        <EmptyState icon={Users} title="No students" description="Try different search filters" />
      ) : (
        <AdminTableSection
          columns={[
            { key: "studentId", label: "ID", render: (row) => row.studentId },
            {
              key: "displayName",
              label: "Name",
              render: (row) => row.displayName,
            },
            { key: "email", label: "Email" },
            {
              key: "courseName",
              label: "Course",
              render: (row) => {
                const count = overviewRows.find((r) => r.student.id === row.id)?.enrollmentCount ?? 0;
                return (
                  <div className="flex flex-wrap gap-1">
                    <span>{row.courseName}</span>
                    {count > 1 && <Badge variant="outline">{count} courses</Badge>}
                  </div>
                );
              },
            },
            {
              key: "registrationStatus",
              label: "Registration",
              render: (row) => (
                <EnrollmentStatusBadge status={row.registrationStatus ?? "approved"} />
              ),
            },
            {
              key: "active",
              label: "Status",
              render: (row) => (
                <Badge variant={row.active !== false ? "default" : "outline"}>
                  {row.active !== false ? "Active" : "Disabled"}
                </Badge>
              ),
            },
            {
              key: "id",
              label: "Actions",
              render: (row) => (
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setDrawerStudent(row)}>
                    <Pencil className="mr-1 size-3.5" /> Manage
                  </Button>
                  {canDisable && (
                    <Button type="button" size="sm" variant="outline" onClick={() => void toggleActive(row)}>
                      {row.active === false ? "Enable" : "Disable"}
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          data={filteredStudents}
          summaryItems={summaryItems}
          getSelectionInsights={studentListSelectionInsights}
          entityLabel="student"
          renderBulkActions={
            canDisable
              ? (selectedIds) => (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void handleBulkSetActive(selectedIds, true)}
                    >
                      Enable selected
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void handleBulkSetActive(selectedIds, false)}
                    >
                      Disable selected
                    </Button>
                  </>
                )
              : undefined
          }
          onActionComplete={handleRefresh}
        />
      )}

      <StudentUpdateDrawer
        student={drawerStudent}
        open={!!drawerStudent}
        onOpenChange={(open) => !open && setDrawerStudent(null)}
        onUpdated={handleRefresh}
      />
    </div>
  );
}
