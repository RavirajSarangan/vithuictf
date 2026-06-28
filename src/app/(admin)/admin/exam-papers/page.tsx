"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminTable } from "@/components/admin/admin-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminExamPaperBatches, usePaperCentersList } from "@/hooks/use-exam-papers";
import { deleteExamPaperBatch } from "@/lib/actions/exam-papers";
import { FileText, Loader2, Trash2 } from "lucide-react";
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return batches.filter((batch) => {
      if (centerFilter !== "all" && batch.paperCenterId !== centerFilter) return false;
      if (staffFilter && !batch.staffName.toLowerCase().includes(staffFilter.toLowerCase())) return false;
      if (yearFilter && String(batch.examYear ?? "") !== yearFilter) return false;
      return true;
    });
  }, [batches, centerFilter, staffFilter, yearFilter]);

  const handleDelete = async (batchId: string) => {
    if (!confirm("Delete this batch and all uploaded papers?")) return;
    setDeletingId(batchId);
    try {
      await deleteExamPaperBatch(batchId);
      refresh();
      toast.success("Batch deleted");
      if (expandedId === batchId) setExpandedId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeletingId(null);
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
          {filtered.map((batch) => {
            const expanded = expandedId === batch.id;
            return (
              <div key={batch.id} className="rounded-lg border">
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-icvf-navy">{batch.centerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {batch.staffName} · {batch.place} · {formatDate(batch.createdAt)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {batch.paperCount} paper{batch.paperCount === 1 ? "" : "s"}
                      {batch.examYear ? ` · ${batch.examYear}` : ""}
                      {batch.medium ? ` · ${batch.medium}` : ""}
                      {batch.examType ? ` · ${batch.examType.toUpperCase()}` : ""}
                    </p>
                    {batch.notes && <p className="mt-1 text-sm">{batch.notes}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setExpandedId(expanded ? null : batch.id)}>
                      {expanded ? "Hide papers" : "View papers"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void handleDelete(batch.id)}
                      disabled={deletingId === batch.id}
                    >
                      {deletingId === batch.id ? (
                        <Loader2 className="mr-1 size-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-1 size-4" />
                      )}
                      Delete
                    </Button>
                  </div>
                </div>

                {expanded && (
                  <div className="border-t p-4">
                    <AdminTable
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
                      data={batch.submissions}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
