"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  formatPaperCenterGradeLabel,
  type PaperCenterGrade,
} from "@/lib/paper-centers/grades";

export function GradeCheckboxes({
  value,
  onChange,
  options,
}: {
  value: PaperCenterGrade[];
  onChange: (grades: PaperCenterGrade[]) => void;
  options: readonly PaperCenterGrade[];
}) {
  if (options.length === 0) {
    return <p className="text-sm text-muted-foreground">No grades available for this center</p>;
  }

  return (
    <div className="flex flex-wrap gap-3 rounded-md border border-input p-3">
      {options.map((grade) => {
        const checked = value.includes(grade);
        return (
          <label key={grade} className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={checked}
              onCheckedChange={(next) => {
                if (next) onChange([...value, grade]);
                else onChange(value.filter((item) => item !== grade));
              }}
            />
            <span>{formatPaperCenterGradeLabel(grade)}</span>
          </label>
        );
      })}
    </div>
  );
}
