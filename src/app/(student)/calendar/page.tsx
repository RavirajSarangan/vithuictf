"use client";

import { useState } from "react";
import { CalendarBoard } from "@/components/calendar/calendar-board";
import {
  StudentPageHeader,
  StudentPageLoading,
} from "@/components/student/portal/student-portal-states";
import { useActiveCourseId, useActiveCourseName } from "@/contexts/student-course-context";
import { useStudentData } from "@/hooks/use-data";
import { useCalendarMinutesSummary, useCalendarSessions, useSubjectCategories } from "@/hooks/use-calendar";

export default function StudentCalendarPage() {
  const student = useStudentData();
  const activeCourseId = useActiveCourseId(student?.courseId);
  const activeCourseName = useActiveCourseName(student?.courseName);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { data: categories, isLoading: categoriesLoading } = useSubjectCategories();
  const { data: sessions, isLoading: sessionsLoading } = useCalendarSessions(activeCourseId ?? undefined, categoryFilter);
  const summary = useCalendarMinutesSummary(sessions, categories, categoryFilter);

  if (student === undefined || categoriesLoading || sessionsLoading) {
    return <StudentPageLoading rows={2} />;
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-6">
      <StudentPageHeader
        title="Calendar"
        description={
          activeCourseName
            ? `Class schedule and sessions for ${activeCourseName}.`
            : "View your weekly class schedule and today's sessions."
        }
      />
      <CalendarBoard
        sessions={sessions}
        categories={categories}
        categoryFilter={categoryFilter}
        onCategoryFilter={setCategoryFilter}
        showSummary
        weeklyTotal={summary.total}
      />
    </div>
  );
}
