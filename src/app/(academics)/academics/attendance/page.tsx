"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { useBatches, useBatchSessions, useAttendanceSheet } from "@/hooks/use-academics";
import { markAttendance } from "@/lib/actions/academics";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AttendanceStatus } from "@/types";
import { exportToCsv } from "@/lib/export/csv";
import { ClipboardCheck, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

const STATUSES: AttendanceStatus[] = ["present", "absent", "late"];

function AttendancePageContent() {
  const searchParams = useSearchParams();
  const initialSession = searchParams.get("session");
  const { data: batches, loading: batchesLoading } = useBatches();
  const [courseBatchId, setCourseBatchId] = useState("");
  const [sessionId, setSessionId] = useState(initialSession ?? "");
  const { data: sessions, loading: sessionsLoading } = useBatchSessions(courseBatchId || null);
  const { rows, loading: sheetLoading, refresh } = useAttendanceSheet(sessionId || null);
  const [localStatus, setLocalStatus] = useState<Record<string, AttendanceStatus>>({});
  const [saving, setSaving] = useState(false);

  const activeBatches = useMemo(() => batches.filter((b) => b.active), [batches]);

  useEffect(() => {
    if (initialSession) setSessionId(initialSession);
  }, [initialSession]);

  useEffect(() => {
    const next: Record<string, AttendanceStatus> = {};
    for (const row of rows) {
      if (row.status) next[row.studentId] = row.status;
    }
    setLocalStatus(next);
  }, [rows]);

  useEffect(() => {
    if (!courseBatchId && activeBatches.length === 1) {
      setCourseBatchId(activeBatches[0].id);
    }
  }, [activeBatches, courseBatchId]);

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setLocalStatus((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status: AttendanceStatus) => {
    const next: Record<string, AttendanceStatus> = {};
    for (const row of rows) next[row.studentId] = status;
    setLocalStatus(next);
  };

  const handleSave = async () => {
    if (!sessionId) return;
    setSaving(true);
    try {
      const records = rows.map((row) => ({
        studentId: row.studentId,
        status: localStatus[row.studentId] ?? "absent",
      }));
      await markAttendance(sessionId, records);
      refresh();
      toast.success("Attendance saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const batch = activeBatches.find((b) => b.id === courseBatchId);
    const session = sessions.find((s) => s.id === sessionId);
    exportToCsv(
      `${batch?.batchCode ?? "batch"}-class-${session?.sessionNumber ?? "session"}-attendance.csv`,
      rows.map((row) => ({
        batchCode: batch?.batchCode ?? "",
        sessionDate: session?.scheduledDate ?? "",
        studentName: row.studentName,
        enrollmentCode: row.enrollmentCode,
        status: localStatus[row.studentId] ?? row.status ?? "unmarked",
      }))
    );
  };

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
                <SelectItem key={b.id} value={b.id}>{b.name} ({b.batchCode})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Class session</label>
          <Select value={sessionId} onValueChange={(value) => setSessionId(value ?? "")} disabled={!courseBatchId}>
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

      {sessionId && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => markAll("present")}>All present</Button>
          <Button type="button" size="sm" variant="outline" onClick={() => markAll("absent")}>All absent</Button>
        </div>
      )}

      {sessionId && rows.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={handleExport}>
            <Download className="mr-2 size-4" /> Export CSV
          </Button>
        </div>
      )}

      {!sessionId ? (
        <p className="text-sm text-muted-foreground">Choose a batch and session to begin.</p>
      ) : sheetLoading ? (
        <p className="text-sm text-muted-foreground">Loading attendance sheet…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No enrolled students in this batch.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Student</th>
                <th className="px-4 py-3 text-left font-medium">Enrollment ID</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.studentId} className="border-t border-border">
                  <td className="px-4 py-3">{row.studentName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.enrollmentCode}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {STATUSES.map((status) => {
                        const active = (localStatus[row.studentId] ?? row.status) === status;
                        return (
                          <button
                            key={status}
                            type="button"
                            className="min-h-11 min-w-11 rounded-md px-3 py-2 capitalize"
                            onClick={() => setStatus(row.studentId, status)}
                          >
                            <Badge variant={active ? "default" : "outline"}>{status}</Badge>
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sessionId && rows.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 p-4 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
          <Button className="w-full md:w-auto" onClick={() => void handleSave()} disabled={saving}>
            {saving ? <><Loader2 className="mr-2 size-4 animate-spin" /> Saving…</> : <><ClipboardCheck className="mr-2 size-4" /> Save attendance</>}
          </Button>
        </div>
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
