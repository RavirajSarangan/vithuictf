"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { CourseThumbnail } from "@/components/courses/course-card";
import { Badge } from "@/components/ui/badge";
import type { Course } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  courses: Course[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  className?: string;
};

export function CourseMultiSelect({ courses, selectedIds, onChange, className }: Props) {
  const toggle = (courseId: string, checked: boolean) => {
    onChange(
      checked ? [...selectedIds, courseId] : selectedIds.filter((id) => id !== courseId)
    );
  };

  if (!courses.length) {
    return <p className="text-sm text-muted-foreground">No courses available</p>;
  }

  return (
    <div className={cn("flex max-h-64 flex-col gap-2 overflow-y-auto rounded-lg border p-2", className)}>
      {courses.map((course) => {
        const checked = selectedIds.includes(course.id);
        return (
          <label
            key={course.id}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-md p-2 transition-colors hover:bg-muted/50",
              checked && "bg-muted/40"
            )}
          >
            <Checkbox
              checked={checked}
              onCheckedChange={(v) => toggle(course.id, v === true)}
              className="mt-1"
            />
            <CourseThumbnail title={course.name} coverImageUrl={course.coverImageUrl} className="size-10" />
            <div className="min-w-0 flex-1">
              <p className="font-medium leading-tight">{course.name}</p>
              <p className="text-xs text-muted-foreground">
                {course.level}
                {course.teacherName ? ` · ${course.teacherName}` : ""}
                {course.durationMonths ? ` · ${course.durationMonths} mo` : ""}
              </p>
              {course.category && (
                <Badge variant="outline" className="mt-1 text-[10px]">
                  {course.category}
                </Badge>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
}
