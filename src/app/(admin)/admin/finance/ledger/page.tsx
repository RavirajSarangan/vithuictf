"use client";

import { useMemo, useState } from "react";
import { FinanceSubNav } from "@/components/finance/finance-sub-nav";
import { AdminTable } from "@/components/admin/admin-table";
import { ExportCsvButton } from "@/components/admin/export-csv-button";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useFinanceLedger } from "@/hooks/use-finance";
import { useAdminCourses } from "@/hooks/use-data";
import type { SessionCharge } from "@/types";

function statusBadge(status: SessionCharge["status"]) {
  const variants: Record<SessionCharge["status"], "default" | "secondary" | "outline" | "destructive"> = {
    pending: "secondary",
    paid: "default",
    waived: "outline",
    void: "destructive",
  };
  return <Badge variant={variants[status]}>{status}</Badge>;
}

export default function AdminFinanceLedgerPage() {
  const [status, setStatus] = useState<string>("all");
  const [courseId, setCourseId] = useState<string>("all");
  const { data: courses } = useAdminCourses();

  const filters = useMemo(
    () => ({
      status:
        status === "all"
          ? undefined
          : (status as "pending" | "paid" | "waived" | "void"),
      courseId: courseId === "all" ? undefined : courseId,
    }),
    [status, courseId]
  );

  const { charges, loading } = useFinanceLedger(filters);

  const csvRows = charges.map((c) => ({
    course: c.courseName ?? "",
    batch: c.batchName ?? "",
    session: c.sessionNumber ?? "",
    date: c.scheduledDate ?? "",
    amount: c.amountLkr,
    status: c.status,
    month: c.billingMonth,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Session charge ledger"
        description="All per-class charges generated from attendance"
        action={
          <ExportCsvButton
            filename="finance-ledger.csv"
            rows={csvRows}
            columns={[
              { key: "course", label: "Course" },
              { key: "batch", label: "Batch" },
              { key: "session", label: "Session" },
              { key: "date", label: "Date" },
              { key: "amount", label: "Amount (LKR)" },
              { key: "status", label: "Status" },
              { key: "month", label: "Billing month" },
            ]}
          />
        }
      />
      <FinanceSubNav />

      <div className="flex flex-wrap gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v ?? "all")}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="waived">Waived</SelectItem>
              <SelectItem value="void">Void</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Course</Label>
          <Select value={courseId} onValueChange={(v) => setCourseId(v ?? "all")}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : (
        <AdminTable
          data={charges}
          emptyMessage="No charges match these filters"
          columns={[
            { key: "courseName", label: "Course" },
            { key: "batchName", label: "Batch" },
            {
              key: "sessionNumber",
              label: "Session",
              render: (row) => `#${row.sessionNumber ?? "—"} · ${row.scheduledDate ?? ""}`,
            },
            {
              key: "amountLkr",
              label: "Amount",
              render: (row) => `Rs. ${row.amountLkr.toLocaleString()}`,
            },
            {
              key: "status",
              label: "Status",
              render: (row) => statusBadge(row.status),
            },
            { key: "billingMonth", label: "Month" },
          ]}
        />
      )}
    </div>
  );
}
