"use client";

import { useState } from "react";
import Link from "next/link";
import { BatchCreateDialog } from "@/components/academics/batch-create-dialog";
import { useActiveBatchesOverview } from "@/hooks/use-academics";
import { GlassCard } from "@/components/shared/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseThumbnail } from "@/components/courses/course-card";
import { Layers, Plus } from "lucide-react";

export function DashboardActiveBatches() {
  const { data, loading } = useActiveBatchesOverview();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <GlassCard className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-icvf-navy">Active batches</h2>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 size-4" />
              Add batch
            </Button>
            <Link href="/academics/batches" className="text-xs font-medium text-icvf-accent hover:underline self-center">
              View all
            </Link>
          </div>
        </div>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active batches. Create one to start scheduling classes.</p>
        ) : (
          <ul className="space-y-3">
            {data.map((batch) => (
              <li key={batch.id} className="flex gap-3 rounded-lg border border-icvf-border/60 p-3">
                <CourseThumbnail
                  title={batch.courseName ?? batch.name}
                  coverImageUrl={batch.courseCoverImageUrl}
                  className="size-12 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/academics/batches/${batch.id}`} className="font-semibold text-icvf-navy hover:underline">
                      {batch.name}
                    </Link>
                    <Badge variant="outline">{batch.batchCode}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{batch.courseName}</p>
                  <p className="text-xs text-muted-foreground">
                    {batch.startDate} → {batch.endDate} · {batch.totalClasses} class days ·{" "}
                    {batch.classDays.join(", ").toUpperCase()} · starts {batch.startTime.slice(0, 5)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {batch.enrolledCount} students
                    {batch.nextSessionDate
                      ? ` · Next class ${batch.nextSessionDate} ${batch.nextSessionTime?.slice(0, 5) ?? ""}`
                      : " · No upcoming classes"}
                  </p>
                  <Link
                    href={`/academics/batches/${batch.id}#enrolled`}
                    className="text-xs text-icvf-accent hover:underline"
                  >
                    View students
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
      <BatchCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
