"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { BatchEditDialog } from "@/components/academics/batch-edit-dialog";
import { BatchMessageDialog } from "@/components/academics/batch-message-dialog";
import { BatchSessionMonthCalendar } from "@/components/academics/batch-session-month-calendar";
import { AttendanceSheet } from "@/components/academics/attendance-sheet";
import { BatchStudentEnrollPanel } from "@/components/academics/batch-student-enroll-panel";
import { SessionCancelDialog } from "@/components/academics/session-cancel-dialog";
import { SessionCanvaSlideDialog } from "@/components/academics/session-canva-slide-dialog";
import { SessionEditDialog } from "@/components/academics/session-edit-dialog";
import { SessionStatusBadge } from "@/components/academics/session-status-badge";
import {
  useBatchAttendanceSummary,
  useBatchDetail,
  useBatchSessions,
  useBatchStudents,
  useBatchWhatsAppLog,
  useAttendanceSheet,
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
import { pickDefaultAttendanceSession } from "@/lib/academics/attendance-utils";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AdminTable } from "@/components/admin/admin-table";
import {
  ArrowLeft,
  Download,
  Loader2,
  MessageSquare,
  Pencil,
  Presentation,
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
  const { data: attendanceSummary } = useBatchAttendanceSummary(id);
  const { data: whatsappLog, loading: whatsappLogLoading } = useBatchWhatsAppLog(isAdmin ? id : null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [setAsCurrentOnEnroll, setSetAsCurrentOnEnroll] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [sessionEdit, setSessionEdit] = useState<ClassSession | null>(null);
  const [sessionSlide, setSessionSlide] = useState<ClassSession | null>(null);
  const [sessionCancel, setSessionCancel] = useState<ClassSession | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [attendanceSessionId, setAttendanceSessionId] = useState("");
  const [calendarMonth, setCalendarMonth] = useState<Date | undefined>(undefined);
  const { rows: attendanceRows, loading: attendanceSheetLoading, refresh: refreshAttendance } =
    useAttendanceSheet(attendanceSessionId || null);

  const enrolledIds = useMemo(
    () => new Set(enrollments.filter((e) => e.active).map((e) => e.studentId)),
    [enrollments]
  );

  const sessionStats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: sessions.length,
      cancelled: sessions.filter((s) => s.status === "cancelled").length,
      completed: sessions.filter((s) => s.status === "completed").length,
      remaining: sessions.filter((s) => s.status === "scheduled" && s.scheduledDate >= today).length,
    };
  }, [sessions]);

  const attendanceByStudent = useMemo(
    () => new Map(attendanceSummary.map((r) => [r.studentId, r])),
    [attendanceSummary]
  );

  useEffect(() => {
    if (attendanceSessionId || sessionsLoading || !sessions.length) return;
    const defaultId = pickDefaultAttendanceSession(sessions);
    if (defaultId) setAttendanceSessionId(defaultId);
  }, [sessions, sessionsLoading, attendanceSessionId]);

  const handleBulkEnroll = async () => {
    if (!selectedStudentIds.length) return;
    setEnrolling(true);
    try {
      const fn = setAsCurrentOnEnroll ? enrollStudentsInCourse : enrollStudentsInBatch;
      const result = await fn(id, selectedStudentIds);
      refreshEnrollments();
      setSelectedStudentIds([]);
      toast.success(`Enrolled ${result.enrolled} student(s)`);
      if (result.failed > 0) toast.warning(`${result.failed} enrollment(s) failed`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enrollment failed");
    } finally {
      setEnrolling(false);
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
    if (status === "cancelled") {
      setSessionCancel(session);
      return;
    }
    try {
      await updateSessionTimes(session.id, { status });
      refreshSessions();
      toast.success(`Session marked ${status}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const handleRegenerate = async () => {
    if (!confirm("Regenerate all class sessions? Existing sessions will be deleted if no attendance exists.")) {
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
      enrollments.map((e) => {
        const att = attendanceByStudent.get(e.studentId);
        return {
          enrollmentCode: e.enrollmentCode,
          studentName: e.studentName ?? "",
          studentEmail: e.studentEmail ?? "",
          attended: att ? att.present + att.late : 0,
          totalClasses: att?.totalSessions ?? 0,
          attendancePercent: att?.attendancePercent ?? 0,
          active: e.active ? "yes" : "no",
          joinedAt: e.joinedAt,
        };
      })
    );
  };

  if (batchLoading) {
    return <p className="text-sm text-muted-foreground">Loading batch…</p>;
  }

  if (!batch) {
    return <p className="text-sm text-muted-foreground">Batch not found.</p>;
  }

  const activeEnrollmentCount = enrollments.filter((e) => e.active).length;

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
        description={`${batch.courseName} · ${batch.batchCode} · ${batch.startDate} to ${batch.endDate} · ${batch.totalClasses} planned classes`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setMessageOpen(true)}>
              <MessageSquare className="mr-2 size-4" /> Message students
            </Button>
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

      <div className="flex flex-wrap gap-2 text-sm">
        <Badge variant="secondary">{sessionStats.total} sessions</Badge>
        <Badge variant="outline">{sessionStats.remaining} remaining</Badge>
        <Badge variant="outline">{sessionStats.completed} completed</Badge>
        <Badge variant="outline">{sessionStats.cancelled} cancelled</Badge>
        {batch.zoomLink ? (
          <a href={batch.zoomLink} target="_blank" rel="noreferrer" className="text-icvf-accent hover:underline">
            Zoom link
          </a>
        ) : null}
      </div>

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

      <BatchMessageDialog
        batchId={id}
        batchName={batch.name}
        recipientCount={activeEnrollmentCount}
        open={messageOpen}
        onOpenChange={setMessageOpen}
      />

      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="font-semibold">Enroll students</h2>
        <BatchStudentEnrollPanel
          courseId={batch.courseId}
          selectedIds={selectedStudentIds}
          onSelectionChange={setSelectedStudentIds}
          enrolledStudentIds={enrolledIds}
        />
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={setAsCurrentOnEnroll}
            onCheckedChange={(v) => setSetAsCurrentOnEnroll(v === true)}
          />
          Set this course as current course for enrolled students
        </label>
        <Button
          onClick={() => void handleBulkEnroll()}
          disabled={!selectedStudentIds.length || enrolling}
        >
          {enrolling ? <Loader2 className="mr-2 size-4 animate-spin" /> : <UserPlus className="mr-2 size-4" />}
          Enroll selected ({selectedStudentIds.length})
        </Button>
      </section>

      <section id="enrolled" className="space-y-3">
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
              {
                key: "attended",
                label: "Attended",
                render: (row) => {
                  const att = attendanceByStudent.get(row.studentId);
                  return att ? String(att.present + att.late) : "0";
                },
              },
              {
                key: "totalSessions",
                label: "Total classes",
                render: (row) => String(attendanceByStudent.get(row.studentId)?.totalSessions ?? 0),
              },
              {
                key: "remaining",
                label: "Unmarked",
                render: (row) => String(attendanceByStudent.get(row.studentId)?.unmarked ?? 0),
              },
              {
                key: "attendancePercent",
                label: "Attendance %",
                render: (row) => `${attendanceByStudent.get(row.studentId)?.attendancePercent ?? 0}%`,
              },
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
                      <Button type="button" size="sm" variant="secondary" onClick={() => void handleSetAsCurrentCourse(row.studentId)}>
                        Set current course
                      </Button>
                    ) : null}
                    {row.active ? (
                      <Button type="button" size="sm" variant="outline" onClick={() => void handleSetEnrollmentActive(row.id, false)}>
                        Deactivate
                      </Button>
                    ) : (
                      <Button type="button" size="sm" variant="outline" onClick={() => void handleSetEnrollmentActive(row.id, true)}>
                        Reactivate
                      </Button>
                    )}
                    {isAdmin ? (
                      <Button type="button" size="sm" variant="outline" onClick={() => void handleRemove(row.id)}>
                        Remove
                      </Button>
                    ) : null}
                  </div>
                ),
              },
            ]}
            data={enrollments}
          />
        )}
      </section>

      <section id="attendance" className="space-y-4 rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Mark attendance</h2>
          <Link href={`/academics/attendance?session=${attendanceSessionId}`} className="text-sm text-icvf-navy hover:underline">
            Open full attendance page
          </Link>
        </div>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Generate class sessions to mark attendance.</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(240px,280px)_1fr]">
            <BatchSessionMonthCalendar
              sessions={sessions}
              selectedSessionId={attendanceSessionId}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              onSelectSession={(session) => setAttendanceSessionId(session.id)}
            />
            <div>
              {!attendanceSessionId ? (
                <p className="text-sm text-muted-foreground">Select a class date on the calendar.</p>
              ) : (
                <AttendanceSheet
                  sessionId={attendanceSessionId}
                  rows={attendanceRows}
                  loading={attendanceSheetLoading}
                  batchCode={batch.batchCode}
                  sessionNumber={sessions.find((s) => s.id === attendanceSessionId)?.sessionNumber}
                  sessionDate={sessions.find((s) => s.id === attendanceSessionId)?.scheduledDate}
                  stickySave={false}
                  autoSave
                  onSaved={refreshAttendance}
                />
              )}
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Class sessions</h2>
          {isAdmin ? (
            <Button type="button" size="sm" variant="outline" disabled={regenerating} onClick={() => void handleRegenerate()}>
              {regenerating ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
              Regenerate sessions
            </Button>
          ) : null}
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
                className={`flex flex-col gap-2 rounded-md border border-border p-3 text-sm ${
                  session.status === "cancelled" ? "opacity-70" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/academics/attendance?session=${session.id}`} className="font-medium hover:underline">
                    Class {session.sessionNumber}
                  </Link>
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    {session.canvaSlideUrl ? (
                      <Badge variant="secondary" className="text-xs">
                        Slides
                      </Badge>
                    ) : null}
                    <SessionStatusBadge status={session.status} />
                  </div>
                </div>
                <p className={session.status === "cancelled" ? "text-muted-foreground line-through" : "text-muted-foreground"}>
                  {session.scheduledDate}
                </p>
                <p className="text-xs text-muted-foreground">
                  {session.startTime.slice(0, 5)} – {session.endTime.slice(0, 5)}
                </p>
                {session.cancelReason ? (
                  <p className="text-xs text-destructive">{session.cancelReason}</p>
                ) : null}
                <div className="flex flex-wrap gap-1 pt-1">
                  <Button type="button" size="sm" variant="ghost" onClick={() => setSessionSlide(session)}>
                    <Presentation className="mr-1 size-3.5" />
                    Slides
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setSessionEdit(session)}>
                    Edit
                  </Button>
                  {session.status !== "completed" && session.status !== "cancelled" ? (
                    <Button type="button" size="sm" variant="ghost" onClick={() => void handleSessionStatus(session, "completed")}>
                      Complete
                    </Button>
                  ) : null}
                  {session.status !== "cancelled" ? (
                    <Button type="button" size="sm" variant="ghost" onClick={() => setSessionCancel(session)}>
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {isAdmin ? (
        <section className="space-y-3">
          <h2 className="font-semibold">WhatsApp delivery log</h2>
          <p className="text-sm text-muted-foreground">
            Recent automated and manual WhatsApp messages for this batch.
          </p>
          {whatsappLogLoading ? (
            <p className="text-sm text-muted-foreground">Loading WhatsApp log…</p>
          ) : whatsappLog.length === 0 ? (
            <p className="text-sm text-muted-foreground">No WhatsApp messages logged yet.</p>
          ) : (
            <AdminTable
              columns={[
                {
                  key: "createdAt",
                  label: "Sent",
                  render: (row) => new Date(row.createdAt).toLocaleString(),
                },
                { key: "studentName", label: "Student", render: (row) => row.studentName ?? "—" },
                { key: "messageType", label: "Type" },
                { key: "messageTitle", label: "Title" },
                {
                  key: "status",
                  label: "Status",
                  render: (row) => (
                    <Badge
                      variant={
                        row.status === "sent"
                          ? "default"
                          : row.status === "failed"
                            ? "destructive"
                            : "outline"
                      }
                    >
                      {row.status}
                    </Badge>
                  ),
                },
                {
                  key: "error",
                  label: "Error",
                  render: (row) => row.error ?? "—",
                },
              ]}
              data={whatsappLog}
              emptyMessage="No WhatsApp messages logged"
            />
          )}
        </section>
      ) : null}

      <SessionEditDialog
        session={sessionEdit}
        open={sessionEdit !== null}
        onOpenChange={(open) => {
          if (!open) setSessionEdit(null);
        }}
        onSaved={refreshSessions}
        onManageSlides={(session) => {
          setSessionEdit(null);
          setSessionSlide(session);
        }}
      />

      <SessionCanvaSlideDialog
        session={sessionSlide}
        open={sessionSlide !== null}
        onOpenChange={(open) => {
          if (!open) setSessionSlide(null);
        }}
        onSaved={refreshSessions}
      />

      <SessionCancelDialog
        session={sessionCancel}
        batchName={batch.name}
        open={sessionCancel !== null}
        onOpenChange={(open) => {
          if (!open) setSessionCancel(null);
        }}
        onCancelled={refreshSessions}
      />
    </div>
  );
}
