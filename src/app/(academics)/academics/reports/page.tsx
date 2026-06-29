"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { AdminTable } from "@/components/admin/admin-table";
import {
  useBatchAttendanceSummary,
  useBatches,
  useStudentAttendanceHistory,
} from "@/hooks/use-academics";
import { exportToCsv } from "@/lib/export/csv";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

function attendanceBadgeVariant(percent: number): "default" | "outline" | "destructive" {
  if (percent < 75) return "destructive";
  if (percent < 85) return "outline";
  return "default";
}

export default function AcademicsReportsPage() {
  const { data: batches, loading: batchesLoading } = useBatches();
  const [batchId, setBatchId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const { data: summary, loading: summaryLoading } = useBatchAttendanceSummary(batchId || null, {
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  });
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string } | null>(null);
  const { data: history, loading: historyLoading } = useStudentAttendanceHistory(
    selectedStudent?.id ?? null,
    batchId || null
  );

  const activeBatches = useMemo(() => batches.filter((b) => b.active), [batches]);
  const batch = batches.find((b) => b.id === batchId);

  const handleExportSummary = () => {
    const range = fromDate || toDate ? `-${fromDate || "start"}-to-${toDate || "end"}` : "";
    exportToCsv(`${batch?.batchCode ?? "batch"}${range}-attendance-summary.csv`, summary);
  };

  const handleExportHistory = () => {
    if (!selectedStudent) return;
    exportToCsv(`${selectedStudent.name}-attendance-history.csv`, history.map((h) => ({
      sessionNumber: h.sessionNumber,
      scheduledDate: h.scheduledDate,
      attendance: h.status ?? "unmarked",
      sessionStatus: h.sessionStatus,
    })));
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Attendance reports"
        description="Per-batch attendance summaries and student drill-down"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Batch</label>
          <Select value={batchId} onValueChange={(v) => { setBatchId(v ?? ""); setSelectedStudent(null); }}>
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
          <label className="text-sm font-medium">From date</label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">To date</label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
      </div>

      {!batchId ? (
        <p className="text-sm text-muted-foreground">Select a batch to view attendance reports.</p>
      ) : summaryLoading ? (
        <p className="text-sm text-muted-foreground">Loading summary…</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={handleExportSummary} disabled={!summary.length}>
              <Download className="mr-2 size-4" /> Export summary CSV
            </Button>
          </div>
          <AdminTable
            columns={[
              { key: "studentName", label: "Student" },
              { key: "enrollmentCode", label: "Enrollment ID" },
              { key: "present", label: "Present" },
              { key: "late", label: "Late" },
              { key: "absent", label: "Absent" },
              { key: "unmarked", label: "Unmarked" },
              {
                key: "attendancePercent",
                label: "Attendance %",
                render: (row) => (
                  <Badge variant={attendanceBadgeVariant(row.attendancePercent)}>
                    {row.attendancePercent}%
                  </Badge>
                ),
              },
              {
                key: "studentId",
                label: "Details",
                render: (row) => (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedStudent({ id: row.studentId, name: row.studentName })}
                  >
                    View history
                  </Button>
                ),
              },
            ]}
            data={summary}
            rowClassName={(row) =>
              cn(row.attendancePercent < 75 && "bg-destructive/5")
            }
          />
        </>
      )}

      <Dialog open={selectedStudent !== null} onOpenChange={(open) => { if (!open) setSelectedStudent(null); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedStudent?.name} — attendance history</DialogTitle>
          </DialogHeader>
          {historyLoading ? (
            <p className="text-sm text-muted-foreground">Loading history…</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions found.</p>
          ) : (
            <>
              <Button type="button" size="sm" variant="outline" onClick={handleExportHistory}>
                <Download className="mr-2 size-4" /> Export history CSV
              </Button>
              <div className="space-y-2">
                {history.map((row) => (
                  <div
                    key={row.sessionId}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">Class {row.sessionNumber}</p>
                      <p className="text-muted-foreground">{row.scheduledDate}</p>
                    </div>
                    <Badge variant={row.status ? "default" : "outline"}>
                      {row.status ?? "unmarked"}
                    </Badge>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
