"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { AdminTable } from "@/components/admin/admin-table";
import { BatchCreateDialog } from "@/components/academics/batch-create-dialog";
import { useBatches } from "@/hooks/use-academics";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { CourseThumbnail } from "@/components/courses/course-card";
import { Layers, Plus } from "lucide-react";

export default function AcademicsBatchesPage() {
  const { data, loading, refresh } = useBatches();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Batches"
        description="Create course batches with schedules and auto-generated class sessions"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 size-4" /> New batch
          </Button>
        }
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading batches…</p>
      ) : data.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No batches yet"
          description="Create your first batch to enroll students and track attendance"
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 size-4" /> New batch
            </Button>
          }
        />
      ) : (
        <AdminTable
          columns={[
            {
              key: "courseCoverImageUrl",
              label: "",
              render: (row) => (
                <CourseThumbnail
                  title={row.courseName ?? row.name}
                  coverImageUrl={row.courseCoverImageUrl}
                  className="size-10"
                />
              ),
            },
            {
              key: "name",
              label: "Batch",
              render: (row) => (
                <Link href={`/academics/batches/${row.id}`} className="font-medium text-icvf-navy hover:underline">
                  {row.name}
                </Link>
              ),
            },
            { key: "batchCode", label: "Code" },
            { key: "courseName", label: "Course" },
            {
              key: "startDate",
              label: "Schedule",
              render: (row) => `${row.startDate} → ${row.endDate}`,
            },
            {
              key: "totalClasses",
              label: "Classes",
              render: (row) => String(row.totalClasses),
            },
            {
              key: "active",
              label: "Status",
              render: (row) => (
                <Badge variant={row.active ? "default" : "outline"}>{row.active ? "Active" : "Archived"}</Badge>
              ),
            },
          ]}
          data={data}
        />
      )}

      <BatchCreateDialog open={open} onOpenChange={setOpen} onCreated={refresh} />
    </div>
  );
}
