"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { StudentSearchBar } from "@/components/academics/student-search-bar";
import { EnrollmentStatusBadge } from "@/components/academics/enrollment-status-badge";
import { StudentFinderCombobox } from "@/components/academics/student-finder-combobox";
import { useFacultyBatches, useFacultyEnrollmentOverview } from "@/hooks/use-faculty-academics";
import {
  enrollStudentsInBatch,
  removeStudentFromBatch,
  setEnrollmentActive,
} from "@/lib/actions/faculty-academics";
import { getActionErrorMessage } from "@/lib/action-error";
import {
  filterStudentsWithEnrollments,
  sortStudents,
  type StudentSearchFilters,
} from "@/lib/academics/student-search";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { GlassCard } from "@/components/shared/glass-card";
import { Loader2, UserCheck, Users } from "lucide-react";
import { toast } from "sonner";

export default function FacultyEnrollmentsPage() {
  const { data: overview, loading, refresh } = useFacultyEnrollmentOverview();
  const { data: batches } = useFacultyBatches();
  const { user } = useAuth();
  const canRemove = user?.role === "admin" || user?.role === "super_admin";

  const [filters, setFilters] = useState<StudentSearchFilters>({});
  const [sort, setSort] = useState<"name" | "newest">("name");
  const [quickStudentIds, setQuickStudentIds] = useState<string[]>([]);
  const [quickBatchId, setQuickBatchId] = useState<string>("");
  const [enrolling, setEnrolling] = useState(false);

  const activeBatches = useMemo(() => batches.filter((b) => b.active), [batches]);

  const stats = useMemo(() => {
    const activeEnrollments = overview.reduce((sum, r) => sum + r.enrollmentCount, 0);
    return { total: overview.length, batches: activeBatches.length, activeEnrollments };
  }, [overview, activeBatches]);

  const filtered = useMemo(() => {
    const rows = filterStudentsWithEnrollments(overview, filters);
    return sortStudents(rows, sort);
  }, [overview, filters, sort]);

  const studentsForFinder = useMemo(() => overview.map((r) => r.student), [overview]);

  const handleQuickEnroll = async () => {
    if (!quickStudentIds.length || !quickBatchId) {
      toast.error("Select students and a batch");
      return;
    }
    setEnrolling(true);
    try {
      const result = await enrollStudentsInBatch(quickBatchId, quickStudentIds);
      toast.success(`Enrolled ${result.enrolled} student${result.enrolled === 1 ? "" : "s"}`);
      setQuickStudentIds([]);
      setQuickBatchId("");
      refresh();
    } catch (e) {
      toast.error(getActionErrorMessage(e, "Enrollment failed"));
    } finally {
      setEnrolling(false);
    }
  };

  const toggleActive = async (enrollmentId: string, active: boolean) => {
    try {
      await setEnrollmentActive(enrollmentId, active);
      toast.success(active ? "Enrollment reactivated" : "Enrollment deactivated");
      refresh();
    } catch (e) {
      toast.error(getActionErrorMessage(e, "Failed to update enrollment"));
    }
  };

  const removeEnrollment = async (enrollmentId: string) => {
    try {
      await removeStudentFromBatch(enrollmentId);
      toast.success("Enrollment removed");
      refresh();
    } catch (e) {
      toast.error(getActionErrorMessage(e, "Failed to remove enrollment"));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Enrollments"
        description="Search students and manage batch enrollment for your courses"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <GlassCard className="p-4">
          <p className="text-xs text-muted-foreground">Students</p>
          <p className="text-2xl font-semibold">{stats.total}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-xs text-muted-foreground">Active batches</p>
          <p className="text-2xl font-semibold">{stats.batches}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-xs text-muted-foreground">Active enrollments</p>
          <p className="text-2xl font-semibold">{stats.activeEnrollments}</p>
        </GlassCard>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All students</TabsTrigger>
          <TabsTrigger value="quick">Quick enroll</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 flex flex-col gap-4">
          <StudentSearchBar filters={filters} onChange={setFilters} batches={batches} />
          <div className="flex gap-2">
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
                    <th className="px-4 py-3 font-medium">Batches</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(({ student, enrollments }) => (
                    <tr key={student.id} className="border-b align-top last:border-b-0">
                      <td className="px-4 py-3">
                        <p className="font-medium">{student.displayName}</p>
                        <p className="text-xs text-muted-foreground">
                          {student.studentId} · {student.email}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {enrollments.length === 0 ? (
                          <span className="text-xs text-muted-foreground">Not enrolled</span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {enrollments.map((e) => (
                              <div key={e.enrollmentId} className="flex items-center gap-2">
                                <Badge variant={e.active ? "default" : "outline"}>{e.batch.batchCode}</Badge>
                                <span className="text-xs text-muted-foreground">{e.course.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <EnrollmentStatusBadge status={student.registrationStatus ?? "approved"} />
                      </td>
                      <td className="px-4 py-3">
                        {enrollments.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {enrollments.map((e) => (
                              <div key={e.enrollmentId} className="flex gap-1">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => void toggleActive(e.enrollmentId, !e.active)}
                                >
                                  {e.active ? "Deactivate" : "Reactivate"}
                                </Button>
                                {canRemove && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => void removeEnrollment(e.enrollmentId)}
                                  >
                                    Remove
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="quick" className="mt-4 flex max-w-xl flex-col gap-4">
          {activeBatches.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="No active batches"
              description="Batches for your courses will appear here once they're created."
            />
          ) : (
            <>
              <div>
                <p className="mb-2 text-sm font-medium">Students</p>
                <StudentFinderCombobox
                  students={studentsForFinder}
                  value={quickStudentIds}
                  onChange={setQuickStudentIds}
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Batch</p>
                <Select value={quickBatchId} onValueChange={(v) => setQuickBatchId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeBatches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name} · {batch.batchCode} · {batch.courseName ?? "Course"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" disabled={enrolling} onClick={handleQuickEnroll}>
                {enrolling ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Enrolling…
                  </>
                ) : (
                  "Enroll selected"
                )}
              </Button>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
