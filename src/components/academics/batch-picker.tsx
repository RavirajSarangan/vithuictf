"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CourseBatch } from "@/types";

type Props = {
  courseId: string;
  courseName: string;
  batches: CourseBatch[];
  value?: string;
  onChange: (batchId: string) => void;
};

export function BatchPicker({ courseId, courseName, batches, value, onChange }: Props) {
  const courseBatches = batches.filter((b) => b.courseId === courseId && b.active);

  if (!courseBatches.length) {
    return (
      <p className="text-xs text-muted-foreground">
        No active batches for {courseName}. Create one from the Batches page.
      </p>
    );
  }

  return (
    <Select value={value ?? ""} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger>
        <SelectValue placeholder={`Select batch for ${courseName}`} />
      </SelectTrigger>
      <SelectContent>
        {courseBatches.map((batch) => (
          <SelectItem key={batch.id} value={batch.id}>
            {batch.name} · {batch.batchCode} · {batch.startDate}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
