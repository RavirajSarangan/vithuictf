"use client";

import { useMemo } from "react";
import { useAdminParents, useAdminStudents, useCurrentTeacher } from "@/hooks/use-data";
import { AdminTable } from "@/components/admin/admin-table";
import { AddParentDialog } from "@/components/admin/add-parent-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { filterStudentsForTeacher } from "@/lib/teacher-scope";
import { useAuth } from "@/providers/auth-provider";

export default function AdminParentsPage() {
  const { data, refresh } = useAdminParents();
  const { data: students } = useAdminStudents();
  const { user } = useAuth();
  const teacher = useCurrentTeacher();

  const studentNameById = useMemo(
    () => new Map(students.map((student) => [student.id, student.displayName])),
    [students]
  );

  const visibleParents = useMemo(() => {
    if (user?.role !== "teacher" || !teacher?.courseIds?.length) return data;
    const allowedStudentIds = new Set(
      filterStudentsForTeacher(students, "teacher", teacher).map((s) => s.id)
    );
    return data.filter((p) => p.linkedStudentIds.some((id) => allowedStudentIds.has(id)));
  }, [data, students, teacher, user?.role]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Parents"
        description="Create parent accounts and link them to students"
        action={<AddParentDialog onCreated={refresh} />}
      />
      {visibleParents.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No parents yet"
          description="Add a parent account and link their children"
          className="border-white/10 bg-white/5 text-white"
        />
      ) : (
        <AdminTable
          columns={[
            { key: "displayName", label: "Name" },
            { key: "email", label: "Email" },
            {
              key: "linkedStudentIds",
              label: "Linked Students",
              render: (row) => {
                if (row.linkedStudentIds.length === 0) {
                  return <span className="text-white/50">None linked</span>;
                }
                return (
                  <div className="flex flex-wrap gap-1.5">
                    {row.linkedStudentIds.map((studentId) => (
                      <Badge
                        key={studentId}
                        variant="secondary"
                        className="border-white/10 bg-white/10 text-white"
                      >
                        {studentNameById.get(studentId) ?? "Unknown student"}
                      </Badge>
                    ))}
                  </div>
                );
              },
            },
          ]}
          data={visibleParents}
        />
      )}
    </div>
  );
}
