"use client";

import Link from "next/link";
import { useMemo } from "react";
import { FinanceSubNav } from "@/components/finance/finance-sub-nav";
import { AdminTableSection } from "@/components/admin/admin-table-section";
import { financeLedgerSummary } from "@/lib/table-insights";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useFinanceStudentRoster } from "@/hooks/use-finance";

export default function AdminFinanceStudentsPage() {
  const { rows, loading } = useFinanceStudentRoster();

  const tableData = useMemo(
    () => rows.map((r) => ({ ...r, id: r.studentId })),
    [rows]
  );
  const summaryItems = useMemo(
    () =>
      financeLedgerSummary(
        tableData.map((r) => ({
          status: r.totalOutstandingLkr > 0 ? "pending" : "paid",
          amountLkr: r.totalOutstandingLkr,
        }))
      ),
    [tableData]
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Student billing" description="Per-student balances across all enrolled courses" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Student billing"
        description="Each course is billed separately for attended class sessions"
      />
      <FinanceSubNav />
      <AdminTableSection
        data={tableData}
        getRowId={(r) => r.studentId}
        summaryItems={summaryItems}
        entityLabel="student"
        exportConfig={{
          filename: "finance-students.csv",
          columns: [
            { key: "studentName", label: "Student" },
            { key: "courseCount", label: "Courses" },
            { key: "sessionsBilled", label: "Sessions" },
            { key: "totalChargedLkr", label: "Charged (LKR)" },
            { key: "totalPaidLkr", label: "Paid (LKR)" },
            { key: "totalOutstandingLkr", label: "Outstanding (LKR)" },
          ],
        }}
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
