"use client";

import { useEffect, useState } from "react";
import { markAttendance } from "@/lib/actions/academics";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { AttendanceStatus } from "@/types";
import type { AttendanceSheetRow } from "@/hooks/use-academics";
import { exportToCsv } from "@/lib/export/csv";
import { ClipboardCheck, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { getActionErrorMessage } from "@/lib/action-error";
const STATUSES: AttendanceStatus[] = ["present", "absent", "late"];

export type AttendanceSheetProps = {
  sessionId: string;
  rows: AttendanceSheetRow[];
  loading?: boolean;
  batchCode?: string;
  sessionNumber?: number;
  sessionDate?: string;
  compact?: boolean;
  showExport?: boolean;
  stickySave?: boolean;
  autoSave?: boolean;
  onSaved?: () => void;
};

export function AttendanceSheet({
  sessionId,
  rows,
  loading = false,
  batchCode,
  sessionNumber,
  sessionDate,
  compact = false,
  showExport = true,
  stickySave = true,
  autoSave = false,
  onSaved,
}: AttendanceSheetProps) {
  const [localStatus, setLocalStatus] = useState<Record<string, AttendanceStatus>>({});
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const next: Record<string, AttendanceStatus> = {};
    for (const row of rows) {
      if (row.status) next[row.studentId] = row.status;
    }
    setLocalStatus(next);
    setSelected((prev) => {
      const ids = new Set(rows.map((row) => row.studentId));
      return new Set([...prev].filter((id) => ids.has(id)));
    });
  }, [rows]);

  const toggleSelected = (studentId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((prev) =>
      prev.size === rows.length ? new Set() : new Set(rows.map((row) => row.studentId))
    );
  };

  const markSelected = async (status: AttendanceStatus) => {
    if (selected.size === 0) return;
    const count = selected.size;
    const next = { ...localStatus };
    for (const id of selected) next[id] = status;
    setLocalStatus(next);
    setSelected(new Set());
    if (!autoSave || !sessionId) return;

    setSaving(true);
    try {
      await markAttendance(
        sessionId,
        rows.map((row) => ({
          studentId: row.studentId,
          status: next[row.studentId] ?? "absent",
        }))
      );
      onSaved?.();
      toast.success(`${count} student${count === 1 ? "" : "s"} marked ${status} and saved`);
    } catch (e) {
      toast.error(getActionErrorMessage(e, "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (studentId: string, status: AttendanceStatus) => {
    const next = { ...localStatus, [studentId]: status };
    setLocalStatus(next);
    if (!autoSave || !sessionId) return;

    setSaving(true);
    try {
      await markAttendance(
        sessionId,
        rows.map((row) => ({
          studentId: row.studentId,
          status: row.studentId === studentId ? status : (next[row.studentId] ?? "absent"),
        }))
      );
      onSaved?.();
    } catch (e) {
      toast.error(getActionErrorMessage(e, "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  const markAll = async (status: AttendanceStatus) => {
    const next: Record<string, AttendanceStatus> = {};
    for (const row of rows) next[row.studentId] = status;
    setLocalStatus(next);
    if (autoSave && sessionId) {
      setSaving(true);
      try {
        await markAttendance(
          sessionId,
          rows.map((row) => ({ studentId: row.studentId, status }))
        );
        onSaved?.();
        toast.success(`All marked ${status} and saved`);
      } catch (e) {
        toast.error(getActionErrorMessage(e, "Save failed"));
      } finally {
        setSaving(false);
      }
    }
  };

  const buildRecords = () =>
    rows.map((row) => ({
      studentId: row.studentId,
      status: localStatus[row.studentId] ?? "absent",
    }));

  const handleSave = async () => {
    if (!sessionId) return;
    setSaving(true);
    try {
      await markAttendance(sessionId, buildRecords());
      onSaved?.();
      toast.success("Attendance saved");
    } catch (e) {
      toast.error(getActionErrorMessage(e, "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAllAndSave = async (status: AttendanceStatus) => {
    if (!sessionId) return;
    const next: Record<string, AttendanceStatus> = {};
    for (const row of rows) next[row.studentId] = status;
    setLocalStatus(next);
    setSaving(true);
    try {
      await markAttendance(
        sessionId,
        rows.map((row) => ({ studentId: row.studentId, status }))
      );
      onSaved?.();
      toast.success(`All marked ${status} and saved`);
    } catch (e) {
      toast.error(getActionErrorMessage(e, "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    exportToCsv(
      `${batchCode ?? "batch"}-class-${sessionNumber ?? "session"}-attendance.csv`,
      rows.map((row) => ({
        batchCode: batchCode ?? "",
        sessionDate: sessionDate ?? "",
        studentName: row.studentName,
        enrollmentCode: row.enrollmentCode,
        status: localStatus[row.studentId] ?? row.status ?? "unmarked",
      }))
    );
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading attendance sheet…</p>;
  }

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No enrolled students in this batch.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => void markAll("present")}>
          All present
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => void markAll("absent")}>
          All absent
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => void markAll("late")}>
          All late
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={saving || autoSave}
          onClick={() => void handleMarkAllAndSave("present")}
        >
          Mark all present & save
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={saving || autoSave}
          onClick={() => void handleMarkAllAndSave("absent")}
        >
          Mark all absent & save
        </Button>
      </div>

      {autoSave && (
        <p className="text-xs text-muted-foreground">Auto-save on — each tap saves immediately.</p>
      )}

      {showExport && (
        <Button type="button" size="sm" variant="outline" onClick={handleExport}>
          <Download className="mr-2 size-4" /> Export CSV
        </Button>
      )}

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
          <span className="font-medium">{selected.size} selected:</span>
          {STATUSES.map((status) => (
            <Button
              key={status}
              type="button"
              size="sm"
              variant="secondary"
              className="capitalize"
              disabled={saving}
              onClick={() => void markSelected(status)}
            >
              Mark {status}
            </Button>
          ))}
          <Button type="button" size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="w-10 px-4 py-3">
                <Checkbox
                  checked={rows.length > 0 && selected.size === rows.length}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all students"
                />
              </th>
              <th className="px-4 py-3 text-left font-medium">Student</th>
              {!compact && (
                <th className="px-4 py-3 text-left font-medium">Enrollment ID</th>
              )}
              <th className="px-4 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.studentId} className="border-t border-border">
                <td className="px-4 py-3">
                  <Checkbox
                    checked={selected.has(row.studentId)}
                    onCheckedChange={() => toggleSelected(row.studentId)}
                    aria-label={`Select ${row.studentName}`}
                  />
                </td>
                <td className="px-4 py-3">{row.studentName}</td>
                {!compact && (
                  <td className="px-4 py-3 text-muted-foreground">{row.enrollmentCode}</td>
                )}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map((status) => {
                      const active = (localStatus[row.studentId] ?? row.status) === status;
                      return (
                        <button
                          key={status}
                          type="button"
                          className="min-h-11 min-w-11 rounded-md px-3 py-2 capitalize"
                          onClick={() => void setStatus(row.studentId, status)}
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

      {stickySave && !autoSave ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 p-4 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
          <Button className="w-full md:w-auto" onClick={() => void handleSave()} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <ClipboardCheck className="mr-2 size-4" /> Save attendance
              </>
            )}
          </Button>
        </div>
      ) : !autoSave ? (
        <Button onClick={() => void handleSave()} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <ClipboardCheck className="mr-2 size-4" /> Save attendance
            </>
          )}
        </Button>
      ) : null}
    </div>
  );
}
