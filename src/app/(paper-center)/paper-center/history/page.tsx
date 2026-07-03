"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminTableSection } from "@/components/admin/admin-table-section";
import { examPaperBatchTableSummary } from "@/lib/table-insights";
import { StudentPageLoading } from "@/components/student/portal/student-portal-states";
import { useStaffExamPaperBatches } from "@/hooks/use-exam-papers";
import { FileText } from "lucide-react";

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export default function PaperCenterHistoryPage() {
  const { batches, loading } = useStaffExamPaperBatches();
  const summaryItems = useMemo(() => examPaperBatchTableSummary(batches), [batches]);

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
        <AdminTableSection
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
          summaryItems={summaryItems}
          entityLabel="batch"
          exportConfig={{
            filename: "paper-center-uploads.csv",
            columns: [
              { key: "createdAt", label: "Uploaded" },
              { key: "centerName", label: "Center" },
              { key: "staffName", label: "Staff" },
              { key: "place", label: "Place" },
              { key: "examYear", label: "Year" },
              { key: "medium", label: "Medium" },
              { key: "examType", label: "Exam" },
              { key: "paperCount", label: "Papers" },
            ],
          }}
        />
      )}
    </div>
  );
}
