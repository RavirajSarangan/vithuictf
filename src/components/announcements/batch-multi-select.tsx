"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { CourseBatch } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  batches: CourseBatch[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  className?: string;
};

export function BatchMultiSelect({ batches, selectedIds, onChange, className }: Props) {
  const activeBatches = batches.filter((b) => b.active);

  const toggle = (batchId: string, checked: boolean) => {
    onChange(checked ? [...selectedIds, batchId] : selectedIds.filter((id) => id !== batchId));
  };

  if (!activeBatches.length) {
    return <p className="text-sm text-muted-foreground">No active batches available</p>;
  }

  return (
    <div className={cn("flex max-h-56 flex-col gap-1 overflow-y-auto rounded-lg border p-2", className)}>
      {activeBatches.map((batch) => {
        const checked = selectedIds.includes(batch.id);
        return (
          <label
            key={batch.id}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted/50",
              checked && "bg-muted/40"
            )}
          >
            <Checkbox checked={checked} onCheckedChange={(v) => toggle(batch.id, v === true)} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-tight">{batch.name}</p>
              <p className="text-xs text-muted-foreground">
                {batch.courseName ?? batch.batchCode}
                {batch.courseName && batch.batchCode ? ` · ${batch.batchCode}` : ""}
              </p>
            </div>
          </label>
        );
      })}
    </div>
  );
}
