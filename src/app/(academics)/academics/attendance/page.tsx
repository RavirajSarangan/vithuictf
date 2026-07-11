"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { AttendanceSheet } from "@/components/academics/attendance-sheet";
import {
  useBatches,
  useBatchSessions,
  useAttendanceSheet,
  useBatchAttendanceSummary,
} from "@/hooks/use-academics";
import { pickDefaultAttendanceSession } from "@/lib/academics/attendance-utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function AttendancePageContent() {
  const searchParams = useSearchParams();
  const initialSession = searchParams.get("session");
  const { data: batches, loading: batchesLoading } = useBatches();
  const [courseBatchId, setCourseBatchId] = useState("");
  const [sessionId, setSessionId] = useState(initialSession ?? "");
  const { data: sessions, loading: sessionsLoading } = useBatchSessions(courseBatchId || null);
  const { rows, loading: sheetLoading, refresh } = useAttendanceSheet(sessionId || null);
  const { data: attendanceSummary, refresh: refreshSummary } =
    useBatchAttendanceSummary(courseBatchId || null);

  const activeBatches = useMemo(() => batches.filter((b) => b.active), [batches]);

  const attendancePercentByStudent = useMemo(
    () => new Map(attendanceSummary.map((r) => [r.studentId, r.attendancePercent])),
    [attendanceSummary]
  );

  useEffect(() => {
    if (initialSession) setSessionId(initialSession);
  }, [initialSession]);

  useEffect(() => {
    if (!courseBatchId && activeBatches.length === 1) {
      setCourseBatchId(activeBatches[0].id);
    }
  }, [activeBatches, courseBatchId]);

  useEffect(() => {
    if (sessionId && !courseBatchId) {
      const match = sessions.find((s) => s.id === sessionId);
      if (match) setCourseBatchId(match.batchId);
    }
  }, [sessionId, courseBatchId, sessions]);

  useEffect(() => {
    if (initialSession || sessionId || !courseBatchId || sessionsLoading || !sessions.length) return;
    const defaultId = pickDefaultAttendanceSession(sessions);
    if (defaultId) setSessionId(defaultId);
  }, [courseBatchId, sessions, sessionsLoading, sessionId, initialSession]);

  const batch = activeBatches.find((b) => b.id === courseBatchId);
  const session = sessions.find((s) => s.id === sessionId);

  // Base UI's SelectValue renders the raw value (a UUID) unless the root gets
  // a value→label map.
  const batchItems = useMemo(
    () => Object.fromEntries(activeBatches.map((b) => [b.id, `${b.name} (${b.batchCode})`])),
    [activeBatches]
  );
  const sessionItems = useMemo(
    () =>
      Object.fromEntries(
        sessions.map((s) => [s.id, `Class ${s.sessionNumber} · ${s.scheduledDate}`])
      ),
    [sessions]
  );

  return (
    <div className="flex flex-col gap-6 pb-24">
      <PageHeader
        title="Attendance"
        description="Select a batch and class session, then mark student attendance"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Batch</label>
          <Select
            value={courseBatchId}
            items={batchItems}
            onValueChange={(value) => {
              setCourseBatchId(value ?? "");
              setSessionId("");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={batchesLoading ? "Loading…" : "Select batch"} />
            </SelectTrigger>
            <SelectContent>
              {activeBatches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name} ({b.batchCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Class session</label>
          <Select
            value={sessionId}
            items={sessionItems}
            onValueChange={(value) => setSessionId(value ?? "")}
            disabled={!courseBatchId}
          >
            <SelectTrigger>
              <SelectValue placeholder={sessionsLoading ? "Loading…" : "Select session"} />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  Class {s.sessionNumber} · {s.scheduledDate}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!sessionId ? (
        <p className="text-sm text-muted-foreground">Choose a batch and session to begin.</p>
      ) : (
        <AttendanceSheet
          sessionId={sessionId}
          rows={rows}
          loading={sheetLoading}
          batchCode={batch?.batchCode}
          sessionNumber={session?.sessionNumber}
          sessionDate={session?.scheduledDate}
          autoSave
          attendancePercentByStudent={attendancePercentByStudent}
          onSaved={() => {
            refresh();
            refreshSummary();
          }}
        />
      )}
    </div>
  );
}

export default function AcademicsAttendancePage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading attendance…</p>}>
      <AttendancePageContent />
    </Suspense>
  );
}
