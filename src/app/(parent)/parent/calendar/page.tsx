"use client";

import { useState } from "react";
import { CalendarBoard } from "@/components/calendar/calendar-board";
import { useParentData } from "@/hooks/use-data";
import { StudentPageLoading } from "@/components/student/portal/student-portal-states";
import { useCalendarMinutesSummary, useCalendarSessions, useSubjectCategories } from "@/hooks/use-calendar";

export default function ParentCalendarPage() {
  const { children, loading } = useParentData();
  const child = children[0];
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { data: categories } = useSubjectCategories();
  const { data: sessions } = useCalendarSessions(child?.courseId, categoryFilter);
  const summary = useCalendarMinutesSummary(sessions, categories, categoryFilter);

  if (loading) return <StudentPageLoading rows={2} />;
  if (!child) return <p className="text-white/70">No linked student found.</p>;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-white/70">Schedule for {child.displayName}</p>
      <CalendarBoard
        sessions={sessions}
        categories={categories}
        categoryFilter={categoryFilter}
        onCategoryFilter={setCategoryFilter}
        showSummary
        weeklyTotal={summary.total}
        variant="dark"
      />
    </div>
  );
}
