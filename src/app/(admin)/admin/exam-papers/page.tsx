"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminTableSection } from "@/components/admin/admin-table-section";
import { DeleteConfirmDialog } from "@/components/admin/bulk-delete-dialog";
import { useBulkDeleteHandler } from "@/hooks/use-bulk-delete";
import { bulkDeleteExamPaperBatches } from "@/lib/actions/bulk-delete";
import { examPaperBatchTableSummary, genericTableSummary } from "@/lib/table-insights";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminExamPaperBatches, usePaperCentersList } from "@/hooks/use-exam-papers";
import { getActionErrorMessage } from "@/lib/action-error";
import { deleteExamPaperBatch } from "@/lib/actions/exam-papers";
import { FileText } from "lucide-react";
import { toast } from "sonner";

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminExamPapersPage() {
  const { batches, loading, refresh } = useAdminExamPaperBatches();
  const { centers } = usePaperCentersList();
  const [centerFilter, setCenterFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    return batches.filter((batch) => {
      if (centerFilter !== "all" && batch.paperCenterId !== centerFilter) return false;
      if (staffFilter && !batch.staffName.toLowerCase().includes(staffFilter.toLowerCase())) return false;
      if (yearFilter && String(batch.examYear ?? "") !== yearFilter) return false;
      return true;
    });
  }, [batches, centerFilter, staffFilter, yearFilter]);

  const handleBulkDelete = useBulkDeleteHandler(bulkDeleteExamPaperBatches, "batch", refresh);
  const summaryItems = useMemo(() => examPaperBatchTableSummary(filtered), [filtered]);

  const expandedBatch = filtered.find((b) => b.id === expandedId);

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      const result = await deleteExamPaperBatch(deleteTargetId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      refresh();
      toast.success("Batch deleted");
      if (expandedId === deleteTargetId) setExpandedId(null);
      setDeleteTargetId(null);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Delete failed"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Exam Papers"
        description="Review student exam papers uploaded by paper center staff."
      />

      <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Paper center</Label>
          <Select value={centerFilter} onValueChange={(value) => setCenterFilter(value ?? "all")}>
            <SelectTrigger><SelectValue placeholder="All centers" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All centers</SelectItem>
              {centers.map((center) => (
                <SelectItem key={center.id} value={center.id}>{center.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Staff name</Label>
          <Input value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)} placeholder="Filter by staff" />
        </div>
        <div className="space-y-2">
          <Label>Exam year</Label>
          <Input value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} placeholder="e.g. 2025" />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading uploads…</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No exam paper uploads yet"
          description="Paper center staff uploads will appear here for review and download."
        />
      ) : (
        <div className="space-y-4">
          <AdminTableSection
            columns={[
              { key: "centerName", label: "Center" },
              { key: "staffName", label: "Staff" },
              { key: "place", label: "Place" },
              {
                key: "createdAt",
                label: "Uploaded",
                render: (row) => formatDate(row.createdAt),
              },
              {
                key: "paperCount",
                label: "Papers",
                render: (row) => {
                  const parts = [`${row.paperCount}`];
                  if (row.examYear) parts.push(String(row.examYear));
                  if (row.medium) parts.push(row.medium);
                  if (row.examType) parts.push(row.examType.toUpperCase());
                  return parts.join(" · ");
                },
              },
              {
                key: "id",
                label: "Actions",
                render: (row) => (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                  >
                    {expandedId === row.id ? "Hide papers" : "View papers"}
                  </Button>
                ),
              },
            ]}
            data={filtered}
            summaryItems={summaryItems}
            entityLabel="batch"
            onBulkDelete={handleBulkDelete}
            deleteWarning="This will delete the batch and all uploaded papers."
            onDelete={setDeleteTargetId}
            onActionComplete={refresh}
          />

          {expandedBatch && (
            <div className="rounded-lg border p-4">
              <p className="mb-3 text-sm font-medium text-icvf-navy">
                {expandedBatch.centerName} — {expandedBatch.staffName}
                {expandedBatch.notes ? ` · ${expandedBatch.notes}` : ""}
              </p>
              <AdminTableSection
                columns={[
                  { key: "studentName", label: "Student" },
                  { key: "studentIndex", label: "Index", render: (row) => row.studentIndex || "—" },
                  { key: "fileName", label: "File" },
                  { key: "fileSize", label: "Size", render: (row) => formatBytes(row.fileSize) },
                  {
                    key: "id",
                    label: "Download",
                    render: (row) => (
                      <a
                        href={`/api/admin/exam-papers/${row.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-muted"
                      >
                        Download
                      </a>
                    ),
                  },
                ]}
                data={expandedBatch.submissions}
                summaryItems={genericTableSummary(expandedBatch.submissions, "Papers")}
                entityLabel="paper"
                exportConfig={{
                  columns: [
                    { key: "studentName", label: "Student" },
                    { key: "studentIndex", label: "Index" },
                    { key: "fileName", label: "File" },
                  ],
                  filename: "exam-papers.csv",
                }}
              />
            </div>
          )}
        </div>
      )}

      <DeleteConfirmDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        entityLabel="batch"
        warning="This will delete the batch and all uploaded papers."
        deleting={deleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
