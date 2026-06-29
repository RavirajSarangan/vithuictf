"use client";

import { useState } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import { useStudentCourse } from "@/contexts/student-course-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function StudentCourseSwitcher() {
  const { activeCourseId, enrolledCourses, hasMultipleCourses, loading, setActiveCourseId } =
    useStudentCourse();
  const [pending, setPending] = useState(false);

  if (loading || !hasMultipleCourses || !activeCourseId) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <BookOpen className="hidden size-4 text-icvf-text-light sm:block" aria-hidden />
      <Select
        value={activeCourseId}
        onValueChange={(value) => {
          if (!value || value === activeCourseId) return;
          setPending(true);
          void setActiveCourseId(value).finally(() => setPending(false));
        }}
        disabled={pending}
      >
        <SelectTrigger
          className="h-9 w-[min(100vw-8rem,14rem)] border-icvf-border bg-white text-sm sm:w-56"
          aria-label="Switch course"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <SelectValue placeholder="Select course" />
          )}
        </SelectTrigger>
        <SelectContent>
          {enrolledCourses.map((course) => (
            <SelectItem key={course.courseId} value={course.courseId}>
              {course.course.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
