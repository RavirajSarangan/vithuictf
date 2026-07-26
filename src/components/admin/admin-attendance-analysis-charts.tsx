"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassCard } from "@/components/shared/glass-card";
import { AdminTableSection } from "@/components/admin/admin-table-section";
import { Badge } from "@/components/ui/badge";
import { attendanceBadgeVariant } from "@/lib/attendance-format";
import { attendanceReportSummary, absenteeSelectionInsights } from "@/lib/table-insights";
import type {
  AdminAttendanceAnalysis,
  AdminAttendanceAbsenteeRow,
} from "@/hooks/use-admin-data";

interface AdminAttendanceAnalysisChartsProps {
  data: AdminAttendanceAnalysis | null;
  loading: boolean;
}

export function AdminAttendanceAnalysisCharts({ data, loading }: AdminAttendanceAnalysisChartsProps) {
  if (loading || !data) {
    return <p className="text-sm text-muted-foreground">Loading attendance analysis…</p>;
  }

  const summaryItems = attendanceReportSummary(data.topAbsentees);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Overall attendance rate</p>
          <p className="text-2xl font-bold text-icvf-navy">{data.overall.attendanceRate}%</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Sessions in range</p>
          <p className="text-2xl font-bold text-icvf-navy">{data.overall.totalSessions}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Attendance records</p>
          <p className="text-2xl font-bold text-icvf-navy">{data.overall.totalRecords}</p>
        </GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <h3 className="mb-4 font-semibold text-icvf-navy">Weekly Attendance Rate</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="weekStart" tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis tick={{ fill: "#64748b" }} domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="attendanceRate" stroke="#273461" strokeWidth={2} name="Attendance %" />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard>
          <h3 className="mb-4 font-semibold text-icvf-navy">Attendance Rate by Course</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.byCourse}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="courseName" tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis tick={{ fill: "#64748b" }} domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="attendanceRate" fill="#F5A623" radius={[4, 4, 0, 0]} name="Attendance %" />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      <GlassCard>
        <h3 className="mb-4 font-semibold text-icvf-navy">Top Absentees</h3>
        <AdminTableSection<AdminAttendanceAbsenteeRow>
          columns={[
            { key: "studentName", label: "Student" },
            { key: "present", label: "Present" },
            { key: "late", label: "Late" },
            { key: "absent", label: "Absent" },
            { key: "totalMarked", label: "Total" },
            {
              key: "attendancePercent",
              label: "Attendance %",
              render: (row) => (
                <Badge variant={attendanceBadgeVariant(row.attendancePercent)}>{row.attendancePercent}%</Badge>
              ),
            },
          ]}
          data={data.topAbsentees}
          summaryItems={summaryItems}
          getSelectionInsights={absenteeSelectionInsights}
          getRowId={(row) => row.studentId}
          entityLabel="student"
          emptyMessage="No attendance records in this range."
        />
      </GlassCard>
    </div>
  );
}
