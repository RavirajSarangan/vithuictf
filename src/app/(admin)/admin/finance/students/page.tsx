"use client";

import Link from "next/link";
import { FinanceSubNav } from "@/components/finance/finance-sub-nav";
import { AdminTable } from "@/components/admin/admin-table";
import { ExportCsvButton } from "@/components/admin/export-csv-button";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useFinanceStudentRoster } from "@/hooks/use-finance";

export default function AdminFinanceStudentsPage() {
  const { rows, loading } = useFinanceStudentRoster();

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Student billing" description="Per-student balances across all enrolled courses" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const csvRows = rows.map((r) => ({
    student: r.studentName,
    courses: r.courseCount,
    sessions: r.sessionsBilled,
    charged: r.totalChargedLkr,
    paid: r.totalPaidLkr,
    outstanding: r.totalOutstandingLkr,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Student billing"
        description="Each course is billed separately for attended class sessions"
        action={
          <ExportCsvButton
            filename="finance-students.csv"
            rows={csvRows}
            columns={[
              { key: "student", label: "Student" },
              { key: "courses", label: "Courses" },
              { key: "sessions", label: "Sessions" },
              { key: "charged", label: "Charged (LKR)" },
              { key: "paid", label: "Paid (LKR)" },
              { key: "outstanding", label: "Outstanding (LKR)" },
            ]}
          />
        }
      />
      <FinanceSubNav />
      <AdminTable
        data={rows.map((r) => ({ ...r, id: r.studentId }))}
        viewHref={(row) => `/admin/finance/students/${row.studentId}`}
        emptyMessage="No billed students yet — charges appear when attendance is marked"
        columns={[
          {
            key: "studentName",
            label: "Student",
            linkTo: (row) => `/admin/finance/students/${row.studentId}`,
          },
          { key: "courseCount", label: "Courses" },
          { key: "sessionsBilled", label: "Sessions" },
          {
            key: "totalChargedLkr",
            label: "Charged",
            render: (row) => `Rs. ${row.totalChargedLkr.toLocaleString()}`,
          },
          {
            key: "totalPaidLkr",
            label: "Paid",
            render: (row) => `Rs. ${row.totalPaidLkr.toLocaleString()}`,
          },
          {
            key: "totalOutstandingLkr",
            label: "Outstanding",
            render: (row) => (
              <span className={row.totalOutstandingLkr > 0 ? "font-medium text-amber-600" : ""}>
                Rs. {row.totalOutstandingLkr.toLocaleString()}
              </span>
            ),
          },
        ]}
      />
      {rows.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          Students studying multiple courses have separate balances per course.{" "}
          <Link href="/admin/finance/ledger" className="text-primary hover:underline">
            View full ledger
          </Link>
        </p>
      ) : null}
    </div>
  );
}
