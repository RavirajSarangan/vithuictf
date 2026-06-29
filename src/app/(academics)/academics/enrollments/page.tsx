"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { StudentSearchBar } from "@/components/academics/student-search-bar";
import { StudentUpdateDrawer } from "@/components/academics/student-update-drawer";
import { EnrollmentStatusBadge } from "@/components/academics/enrollment-status-badge";
import { CourseMultiSelect } from "@/components/academics/course-multi-select";
import { BatchPicker } from "@/components/academics/batch-picker";
import { StudentFinderCombobox } from "@/components/academics/student-finder-combobox";
import { useEnrollmentOverview, useBatches } from "@/hooks/use-academics";
import { useAdminCourses } from "@/hooks/use-data";
import { enrollStudentsInCourse } from "@/lib/actions/academics";
import {
  filterStudentsWithEnrollments,
  sortStudents,
  type StudentSearchFilters,
} from "@/lib/academics/student-search";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { GlassCard } from "@/components/shared/glass-card";
import { UserCheck, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import type { Student } from "@/types";

export default function AcademicsEnrollmentsPage() {
  const { data: overview, loading, refresh } = useEnrollmentOverview();
  const { data: courses } = useAdminCourses();
  const { data: batches } = useBatches();
  const [filters, setFilters] = useState<StudentSearchFilters>({});
  const [sort, setSort] = useState<"name" | "newest" | "pending_first">("pending_first");
  const [drawerStudent, setDrawerStudent] = useState<Student | null>(null);
  const [quickStudentIds, setQuickStudentIds] = useState<string[]>([]);
  const [quickCourseIds, setQuickCourseIds] = useState<string[]>([]);
  const [quickBatchByCourse, setQuickBatchByCourse] = useState<Record<string, string>>({});
  const [enrolling, setEnrolling] = useState(false);

  const stats = useMemo(() => {
    const pending = overview.filter(
      (r) => (r.student.registrationStatus ?? "approved") === "pending"
    ).length;
    const activeEnrollments = overview.reduce((sum, r) => sum + r.enrollmentCount, 0);
    return {
      total: overview.length,
      pending,
      activeEnrollments,
    };
  }, [overview]);

  const filtered = useMemo(() => {
    const rows = filterStudentsWithEnrollments(overview, filters);
    return sortStudents(rows, sort);
  }, [overview, filters, sort]);

  const pendingRows = useMemo(
    () => overview.filter((r) => (r.student.registrationStatus ?? "approved") === "pending"),
    [overview]
  );

  const studentsForFinder = useMemo(() => overview.map((r) => r.student), [overview]);

  const handleQuickEnroll = async () => {
    if (!quickStudentIds.length || !quickCourseIds.length) {
      toast.error("Select students and courses");
      return;
    }
    setEnrolling(true);
    let total = 0;
    try {
      for (const courseId of quickCourseIds) {
        const batchId = quickBatchByCourse[courseId];
        if (!batchId) {
          toast.error("Select a batch for each course");
          return;
        }
        const result = await enrollStudentsInCourse(batchId, quickStudentIds);
        total += result.enrolled;
      }
      toast.success(`Enrolled ${total} student placement(s)`);
      setQuickStudentIds([]);
      setQuickCourseIds([]);
      setQuickBatchByCourse({});
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enrollment failed");
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Enrollments"
        description="Search students, manage multi-course enrollment, and review pending registrations"
        action={
          <Button variant="outline" render={<Link href="/academics/batches" />}>
            Manage batches
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <GlassCard className="p-4">
          <p className="text-xs text-muted-foreground">Students</p>
          <p className="text-2xl font-semibold">{stats.total}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-xs text-muted-foreground">Pending approvals</p>
          <p className="text-2xl font-semibold">{stats.pending}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-xs text-muted-foreground">Active enrollments</p>
          <p className="text-2xl font-semibold">{stats.activeEnrollments}</p>
        </GlassCard>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All students</TabsTrigger>
          <TabsTrigger value="pending">
            Pending {stats.pending > 0 && `(${stats.pending})`}
          </TabsTrigger>
          <TabsTrigger value="quick">Quick enroll</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 flex flex-col gap-4">
          <StudentSearchBar
            filters={filters}
            onChange={setFilters}
            courses={courses}
            batches={batches}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={sort === "pending_first" ? "default" : "outline"}
              onClick={() => setSort("pending_first")}
            >
              Pending first
            </Button>
            <Button
              type="button"
              size="sm"
              variant={sort === "name" ? "default" : "outline"}
              onClick={() => setSort("name")}
            >
              Name A–Z
            </Button>
            <Button
              type="button"
              size="sm"
              variant={sort === "newest" ? "default" : "outline"}
              onClick={() => setSort("newest")}
            >
              Newest
            </Button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Users} title="No students match" description="Try different filters" />
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <table className="w-full min-w-[800px] text-sm">
                <thead className="border-b bg-muted/40 text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Student</th>
                    <th className="px-4 py-3 font-medium">Courses</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(({ student, enrollments }) => (
                    <tr key={student.id} className="border-b last:border-b-0">
                      <td className="px-4 py-3">
                        <p className="font-medium">{student.displayName}</p>
                        <p className="text-xs text-muted-foreground">
                          {student.studentId} · {student.email}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p>{student.courseName || "—"}</p>
                        {enrollments.length > 1 && (
                          <Badge variant="outline" className="mt-1">
                            {enrollments.length} courses
                          </Badge>
                        )}
                        {enrollments.length > 0 && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {enrollments.map((e) => e.batch.batchCode).join(", ")}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <EnrollmentStatusBadge status={student.registrationStatus ?? "approved"} />
                          <Badge variant={student.active !== false ? "default" : "outline"}>
                            {student.active !== false ? "Active" : "Disabled"}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setDrawerStudent(student)}
                        >
                          Manage
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          {pendingRows.length === 0 ? (
            <EmptyState icon={UserCheck} title="No pending registrations" />
          ) : (
            <div className="flex flex-col gap-2">
              {pendingRows.map(({ student }) => (
                <GlassCard key={student.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{student.displayName}</p>
                    <p className="text-sm text-muted-foreground">
                      {student.email} · {student.courseName}
                    </p>
                  </div>
                  <Button type="button" size="sm" onClick={() => setDrawerStudent(student)}>
                    Review
                  </Button>
                </GlassCard>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="quick" className="mt-4 flex max-w-xl flex-col gap-4">
          <div>
            <p className="mb-2 text-sm font-medium">Students</p>
            <StudentFinderCombobox
              students={studentsForFinder}
              value={quickStudentIds}
              onChange={setQuickStudentIds}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Courses</p>
            <CourseMultiSelect
              courses={courses}
              selectedIds={quickCourseIds}
              onChange={setQuickCourseIds}
            />
          </div>
          {quickCourseIds.map((courseId) => {
            const course = courses.find((c) => c.id === courseId);
            if (!course) return null;
            return (
              <div key={courseId}>
                <p className="mb-1 text-xs font-medium">{course.name}</p>
                <BatchPicker
                  courseId={courseId}
                  courseName={course.name}
                  batches={batches}
                  value={quickBatchByCourse[courseId]}
                  onChange={(batchId) =>
                    setQuickBatchByCourse((prev) => ({ ...prev, [courseId]: batchId }))
                  }
                />
              </div>
            );
          })}
          <Button type="button" disabled={enrolling} onClick={handleQuickEnroll}>
            {enrolling ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Enrolling…
              </>
            ) : (
              "Enroll selected"
            )}
          </Button>
        </TabsContent>
      </Tabs>

      <StudentUpdateDrawer
        student={drawerStudent}
        open={!!drawerStudent}
        onOpenChange={(open) => !open && setDrawerStudent(null)}
        onUpdated={refresh}
      />
    </div>
  );
}
