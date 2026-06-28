"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { BatchEditDialog } from "@/components/academics/batch-edit-dialog";
import { SessionEditDialog } from "@/components/academics/session-edit-dialog";
import { SessionStatusBadge } from "@/components/academics/session-status-badge";
import {
  useBatchDetail,
  useBatchSessions,
  useBatchStudents,
  useAcademicsStudents,
} from "@/hooks/use-academics";
import {
  enrollStudentsInBatch,
  enrollStudentsInCourse,
  removeStudentFromBatch,
  regenerateClassSessions,
  setEnrollmentActive,
  setStudentPrimaryCourse,
  updateBatchSchedule,
  updateSessionTimes,
} from "@/lib/actions/academics";
import { exportToCsv } from "@/lib/export/csv";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AdminTable } from "@/components/admin/admin-table";
import {
  ArrowLeft,
  Download,
  Loader2,
  Pencil,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import type { ClassSession } from "@/types";
import { toast } from "sonner";

export default function AcademicsBatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const { batch, loading: batchLoading, refresh: refreshBatch } = useBatchDetail(id);
  const { data: enrollments, loading: enrollLoading, refresh: refreshEnrollments } =
    useBatchStudents(id);
  const { data: sessions, loading: sessionsLoading, refresh: refreshSessions } =
    useBatchSessions(id);
  const { data: students } = useAcademicsStudents();
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollingAsCurrent, setEnrollingAsCurrent] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [sessionEdit, setSessionEdit] = useState<ClassSession | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  const enrolledIds = useMemo(
    () => new Set(enrollments.filter((e) => e.active).map((e) => e.studentId)),
    [enrollments]
  );

  const availableStudents = useMemo(
    () => students.filter((s) => !enrolledIds.has(s.id) && s.active !== false),
    [students, enrolledIds]
  );

  const toggleStudent = (studentId: string, checked: boolean) => {
    setSelectedStudentIds((prev) =>
      checked ? [...prev, studentId] : prev.filter((sid) => sid !== studentId)
    );
  };

  const handleBulkEnroll = async () => {
    if (!selectedStudentIds.length) return;
    setEnrolling(true);
    try {
      const result = await enrollStudentsInBatch(id, selectedStudentIds);
      refreshEnrollments();
      setSelectedStudentIds([]);
      toast.success(`Enrolled ${result.enrolled} student(s)`);
      if (result.failed > 0) {
        toast.warning(`${result.failed} enrollment(s) failed`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enrollment failed");
    } finally {
      setEnrolling(false);
    }
  };

  const handleBulkEnrollAsCurrent = async () => {
    if (!selectedStudentIds.length) return;
    setEnrollingAsCurrent(true);
    try {
      const result = await enrollStudentsInCourse(id, selectedStudentIds);
      refreshEnrollments();
      setSelectedStudentIds([]);
      toast.success(`Enrolled ${result.enrolled} student(s) and set this as their current course`);
      if (result.failed > 0) {
        toast.warning(`${result.failed} enrollment(s) failed`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enrollment failed");
    } finally {
      setEnrollingAsCurrent(false);
    }
  };

  const handleSetAsCurrentCourse = async (studentId: string) => {
    if (!batch?.courseId) return;
    try {
      await setStudentPrimaryCourse(studentId, batch.courseId);
      toast.success("Current course updated for student");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const handleSetEnrollmentActive = async (enrollmentId: string, active: boolean) => {
    try {
      await setEnrollmentActive(enrollmentId, active);
      refreshEnrollments();
      toast.success(active ? "Enrollment reactivated" : "Enrollment deactivated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const handleRemove = async (enrollmentId: string) => {
    if (!confirm("Permanently remove this enrollment? This cannot be undone.")) return;
    try {
      await removeStudentFromBatch(enrollmentId);
      refreshEnrollments();
      toast.success("Enrollment removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Remove failed");
    }
  };

  const handleArchive = async () => {
    try {
      await updateBatchSchedule(id, { active: false });
      refreshBatch();
      toast.success("Batch archived");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Archive failed");
    }
  };

  const handleReactivate = async () => {
    try {
      await updateBatchSchedule(id, { active: true });
      refreshBatch();
      toast.success("Batch reactivated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reactivate failed");
    }
  };

  const handleSessionStatus = async (session: ClassSession, status: ClassSession["status"]) => {
    try {
      await updateSessionTimes(session.id, { status });
      refreshSessions();
      toast.success(`Session marked ${status}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const handleRegenerate = async () => {
    if (
      !confirm(
        "Regenerate all class sessions? Existing sessions will be deleted if no attendance exists."
      )
    ) {
      return;
    }
    setRegenerating(true);
    try {
      const result = await regenerateClassSessions(id);
      refreshSessions();
      toast.success(`Generated ${result.created} session(s)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Regenerate failed");
    } finally {
      setRegenerating(false);
    }
  };

  const handleExportEnrollments = () => {
    exportToCsv(
      `${batch?.batchCode ?? "batch"}-enrollments.csv`,
      enrollments.map((e) => ({
        enrollmentCode: e.enrollmentCode,
        studentName: e.studentName ?? "",
        studentEmail: e.studentEmail ?? "",
        active: e.active ? "yes" : "no",
        joinedAt: e.joinedAt,
      }))
    );
  };

  if (batchLoading) {
    return <p className="text-sm text-muted-foreground">Loading batch…</p>;
  }

  if (!batch) {
    return <p className="text-sm text-muted-foreground">Batch not found.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link
          href="/academics/batches"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 size-4" /> Batches
        </Link>
      </div>

      <PageHeader
        title={batch.name}
        description={`${batch.courseName} · ${batch.batchCode} · ${batch.startDate} to ${batch.endDate}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 size-4" /> Edit batch
            </Button>
            {batch.active ? (
              <Button variant="outline" onClick={() => void handleArchive()}>
                Archive batch
              </Button>
            ) : (
              <>
                <Badge variant="outline">Archived</Badge>
                <Button variant="outline" onClick={() => void handleReactivate()}>
                  Reactivate
                </Button>
              </>
            )}
          </div>
        }
      />

      <BatchEditDialog
        batch={batch}
        open={editOpen}
        onOpenChange={setEditOpen}
        hasSessions={sessions.length > 0}
        onSaved={() => {
          refreshBatch();
          refreshSessions();
        }}
      />

      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="font-semibold">Enroll students</h2>
        {availableStudents.length === 0 ? (
          <p className="text-sm text-muted-foreground">All eligible students are already enrolled.</p>
        ) : (
          <>
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-border p-3">
              {availableStudents.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={selectedStudentIds.includes(s.id)}
                    onCheckedChange={(checked) => toggleStudent(s.id, checked === true)}
                  />
                  {s.displayName} ({s.studentId})
                </label>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => void handleBulkEnroll()}
              disabled={!selectedStudentIds.length || enrolling || enrollingAsCurrent}
            >
              {enrolling ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 size-4" />
              )}
              Enroll selected ({selectedStudentIds.length})
            </Button>
            <Button
              variant="secondary"
              onClick={() => void handleBulkEnrollAsCurrent()}
              disabled={!selectedStudentIds.length || enrolling || enrollingAsCurrent}
            >
              {enrollingAsCurrent ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 size-4" />
              )}
              Enroll & set as current course
            </Button>
            </div>
          </>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Enrolled students</h2>
          {enrollments.length > 0 && (
            <Button type="button" size="sm" variant="outline" onClick={handleExportEnrollments}>
              <Download className="mr-2 size-4" /> Export CSV
            </Button>
          )}
        </div>
        {enrollLoading ? (
          <p className="text-sm text-muted-foreground">Loading enrollments…</p>
        ) : (
          <AdminTable
            columns={[
              { key: "enrollmentCode", label: "Enrollment ID" },
              { key: "studentName", label: "Name" },
              { key: "studentEmail", label: "Email" },
              {
                key: "active",
                label: "Status",
                render: (row) => (
                  <Badge variant={row.active ? "default" : "outline"}>
                    {row.active ? "Active" : "Inactive"}
                  </Badge>
                ),
              },
              {
                key: "id",
                label: "Actions",
                render: (row) => (
                  <div className="flex flex-wrap gap-2">
                    {row.active ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => void handleSetAsCurrentCourse(row.studentId)}
                      >
                        Set current course
                      </Button>
                    ) : null}
                    {row.active ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void handleSetEnrollmentActive(row.id, false)}
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void handleSetEnrollmentActive(row.id, true)}
                      >
                        Reactivate
                      </Button>
                    )}
                    {isAdmin && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void handleRemove(row.id)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
            data={enrollments}
          />
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Class sessions</h2>
          {isAdmin && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={regenerating}
              onClick={() => void handleRegenerate()}
            >
              {regenerating ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 size-4" />
              )}
              Regenerate sessions
            </Button>
          )}
        </div>
        {sessionsLoading ? (
          <p className="text-sm text-muted-foreground">Loading sessions…</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sessions generated.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex flex-col gap-2 rounded-md border border-border p-3 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/academics/attendance?session=${session.id}`}
                    className="font-medium hover:underline"
                  >
                    Class {session.sessionNumber}
                  </Link>
                  <SessionStatusBadge status={session.status} />
                </div>
                <p className="text-muted-foreground">{session.scheduledDate}</p>
                <p className="text-xs text-muted-foreground">
                  {session.startTime.slice(0, 5)} – {session.endTime.slice(0, 5)}
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setSessionEdit(session)}
                  >
                    Edit
                  </Button>
                  {session.status !== "completed" && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => void handleSessionStatus(session, "completed")}
                    >
                      Complete
                    </Button>
                  )}
                  {session.status !== "cancelled" && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => void handleSessionStatus(session, "cancelled")}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <SessionEditDialog
        session={sessionEdit}
        open={sessionEdit !== null}
        onOpenChange={(open) => {
          if (!open) setSessionEdit(null);
        }}
        onSaved={refreshSessions}
      />
    </div>
  );
}
