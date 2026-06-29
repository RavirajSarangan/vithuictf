"use client";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminTable } from "@/components/admin/admin-table";
import { StudentPageLoading } from "@/components/student/portal/student-portal-states";
import { useStaffExamPaperBatches } from "@/hooks/use-exam-papers";
import { FileText } from "lucide-react";

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export default function PaperCenterHistoryPage() {
  const { batches, loading } = useStaffExamPaperBatches();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Upload History"
        description="Previous exam paper batches you submitted. Files are reviewed by the super administrator."
      />

      {loading ? (
        <StudentPageLoading rows={2} />
      ) : batches.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No uploads yet"
          description="Uploaded batches will appear here with paper counts and exam details."
        />
      ) : (
        <AdminTable
          columns={[
            { key: "createdAt", label: "Uploaded", render: (row) => formatDate(row.createdAt) },
            { key: "centerName", label: "Center" },
            { key: "staffName", label: "Staff" },
            { key: "place", label: "Place" },
            { key: "examYear", label: "Year", render: (row) => row.examYear ?? "—" },
            { key: "medium", label: "Medium", render: (row) => row.medium ?? "—" },
            { key: "examType", label: "Exam", render: (row) => row.examType.toUpperCase() },
            { key: "paperCount", label: "Papers" },
          ]}
          data={batches}
        />
      )}
    </div>
  );
}
