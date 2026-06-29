"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FinanceSubNav } from "@/components/finance/finance-sub-nav";
import { StudentFinanceDetailPanel } from "@/components/finance/student-finance-detail-panel";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useFinanceOverview, useStudentFinanceDetail } from "@/hooks/use-finance";
import { useAdminStudents } from "@/hooks/use-data";

export default function AdminFinanceStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { summaries, charges, loading, refresh } = useStudentFinanceDetail(id);
  const { overview } = useFinanceOverview();
  const { data: students } = useAdminStudents();

  const student = students.find((s) => s.id === id);
  const studentName = student?.displayName ?? summaries[0]?.studentName ?? "Student";
  const perClassFeeLkr = overview?.perClassFeeLkr ?? 1200;

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" render={<Link href="/admin/finance/students" />}>
          <ArrowLeft className="mr-1 size-4" />
          Back
        </Button>
      </div>
      <PageHeader
        title={studentName}
        description="Course-by-course session billing and payments"
      />
      <FinanceSubNav />
      <StudentFinanceDetailPanel
        studentId={id}
        studentName={studentName}
        summaries={summaries}
        charges={charges}
        perClassFeeLkr={perClassFeeLkr}
        onRefresh={refresh}
      />
    </div>
  );
}
