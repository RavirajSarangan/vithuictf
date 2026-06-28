"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addDays, formatWeekRange, getMondayOfWeek } from "@/lib/social-tracking-utils";

interface WeekSelectorProps {
  weekStart: string;
  onChange: (weekStart: string) => void;
}

export function WeekSelector({ weekStart, onChange }: WeekSelectorProps) {
  const goPrev = () => onChange(addDays(weekStart, -7));
  const goNext = () => onChange(addDays(weekStart, 7));
  const goCurrent = () => onChange(getMondayOfWeek());

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="icon" onClick={goPrev} aria-label="Previous week">
        <ChevronLeft className="size-4" />
      </Button>
      <div className="min-w-0 flex-1 text-center">
        <p className="text-sm font-semibold text-icvf-navy">{formatWeekRange(weekStart)}</p>
        <p className="text-xs text-icvf-text-light">Week of {weekStart}</p>
      </div>
      <Button type="button" variant="outline" size="icon" onClick={goNext} aria-label="Next week">
        <ChevronRight className="size-4" />
      </Button>
      <Button type="button" variant="secondary" size="sm" onClick={goCurrent}>
        This week
      </Button>
    </div>
  );
}
