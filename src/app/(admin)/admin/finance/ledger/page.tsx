"use client";

import { useMemo, useState } from "react";
import { FinanceSubNav } from "@/components/finance/finance-sub-nav";
import { AdminTableSection } from "@/components/admin/admin-table-section";
import { financeLedgerSummary } from "@/lib/table-insights";
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

  const summaryItems = useMemo(() => financeLedgerSummary(charges), [charges]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Session charge ledger"
        description="All per-class charges generated from attendance"
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
        <AdminTableSection
          data={charges}
          summaryItems={summaryItems}
          entityLabel="charge"
          exportConfig={{
            filename: "finance-ledger.csv",
            columns: [
              { key: "courseName", label: "Course" },
              { key: "batchName", label: "Batch" },
              { key: "sessionNumber", label: "Session" },
              { key: "scheduledDate", label: "Date" },
              { key: "amountLkr", label: "Amount (LKR)" },
              { key: "status", label: "Status" },
              { key: "billingMonth", label: "Billing month" },
            ],
          }}
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
