"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StudentBatchAttendance } from "@/hooks/use-academics";

interface StudentAttendanceViewProps {
  batches: StudentBatchAttendance[];
  loading?: boolean;
  emptyMessage?: string;
}

export function StudentAttendanceView({
  batches,
  loading,
  emptyMessage = "No batch enrollments found.",
}: StudentAttendanceViewProps) {
  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading attendance…</p>;
  }

  if (batches.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {batches.map((batch) => (
        <Card key={batch.batchId}>
          <CardHeader>
            <CardTitle className="text-lg">{batch.batchName}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {batch.courseName} · {batch.batchCode}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Attendance</p>
                <p className="text-xl font-semibold">{batch.attendancePercent}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Present</p>
                <p className="text-xl font-semibold">{batch.present}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Late</p>
                <p className="text-xl font-semibold">{batch.late}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Absent</p>
                <p className="text-xl font-semibold">{batch.absent}</p>
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[400px] text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Class</th>
                    <th className="px-4 py-2 text-left font-medium">Date</th>
                    <th className="px-4 py-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {batch.history.map((row) => (
                    <tr key={row.sessionId} className="border-t border-border">
                      <td className="px-4 py-2">Class {row.sessionNumber}</td>
                      <td className="px-4 py-2 text-muted-foreground">{row.scheduledDate}</td>
                      <td className="px-4 py-2">
                        <Badge variant={row.status ? "default" : "outline"}>
                          {row.status ?? "unmarked"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
