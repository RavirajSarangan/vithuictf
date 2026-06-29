"use client";

import { useState } from "react";
import { addCalendarSession, deleteCalendarSession } from "@/lib/actions/calendar";
import { useAdminCourses } from "@/hooks/use-data";
import { useAdminSubjectCategories, useCalendarMinutesSummary, useCalendarSessions } from "@/hooks/use-calendar";
import { useUnifiedCalendar } from "@/hooks/use-unified-calendar";
import { CalendarBoard } from "@/components/calendar/calendar-board";
import { UnifiedCalendarBoard } from "@/components/calendar/unified-calendar-board";
import { GlassCard } from "@/components/shared/glass-card";
import { AdminTable } from "@/components/admin/admin-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { computeDurationMinutes, formatMinutes } from "@/lib/calendar/utils";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";

function formatMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default function AdminCalendarPage() {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [calendarMode, setCalendarMode] = useState<"institute" | "unified">("unified");
  const [unifiedFilter, setUnifiedFilter] = useState<"all" | "institute" | "batch">("all");
  const [month, setMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);

  const { data: categories } = useAdminSubjectCategories();
  const { data: courses } = useAdminCourses();
  const { data: sessions, refresh } = useCalendarSessions(undefined, categoryFilter);
  const summary = useCalendarMinutesSummary(sessions, categories, categoryFilter);
  const { items: unifiedItems, loading: unifiedLoading } = useUnifiedCalendar(formatMonthKey(month));

  const [form, setForm] = useState({
    title: "",
    categoryId: "",
    courseId: "",
    sessionType: "recurring" as "recurring" | "one_off",
    dayOfWeek: "1",
    sessionDate: "",
    startTime: "08:00",
    endTime: "09:00",
    teacherName: "Dr. Silva",
    room: "Hall A",
  });

  const previewMinutes = computeDurationMinutes(form.startTime, form.endTime);

  const handleAdd = async () => {
    try {
      const payload = {
        title: form.title,
        categoryId: form.categoryId,
        courseId: form.courseId || undefined,
        sessionType: form.sessionType,
        dayOfWeek: form.sessionType === "recurring" ? Number(form.dayOfWeek) : undefined,
        sessionDate: form.sessionType === "one_off" ? form.sessionDate : undefined,
        startTime: form.startTime,
        endTime: form.endTime,
        teacherName: form.teacherName,
        room: form.room,
      };
      await addCalendarSession(payload);
      refresh();
      toast.success("Session added");
      setForm({ ...form, title: "" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add session");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCalendarSession(id);
      refresh();
      toast.success("Session deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Calendar"
        description="Institute schedule and batch class sessions in one place"
      />

      <Tabs value={calendarMode} onValueChange={(v) => setCalendarMode(v as "institute" | "unified")}>
        <TabsList>
          <TabsTrigger value="unified">Unified view</TabsTrigger>
          <TabsTrigger value="institute">Institute schedule</TabsTrigger>
        </TabsList>
      </Tabs>

      {calendarMode === "unified" ? (
        <div className="space-y-4">
          <Tabs value={unifiedFilter} onValueChange={(v) => setUnifiedFilter(v as typeof unifiedFilter)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="institute">Institute only</TabsTrigger>
              <TabsTrigger value="batch">Batch classes</TabsTrigger>
            </TabsList>
          </Tabs>
          {unifiedLoading ? (
            <p className="text-sm text-muted-foreground">Loading unified calendar…</p>
          ) : (
            <UnifiedCalendarBoard
              items={unifiedItems}
              filter={unifiedFilter}
              month={month}
              onMonthChange={setMonth}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            />
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <GlassCard className="p-4">
              <p className="text-sm text-muted-foreground">Total weekly minutes</p>
              <p className="text-2xl font-bold text-icvf-navy">{formatMinutes(summary.total)}</p>
            </GlassCard>
            {summary.byCategory.map((row) => (
              <GlassCard key={row.categoryId} className="p-4">
                <p className="text-sm text-muted-foreground">{row.categoryName}</p>
                <p className="text-xl font-bold text-icvf-navy">{formatMinutes(row.minutes)}</p>
              </GlassCard>
            ))}
          </div>

          <GlassCard className="p-4">
            <h3 className="mb-4 font-semibold text-icvf-navy">Add class session</h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div>
                <Label>Category</Label>
                <Select value={form.categoryId} onValueChange={(v) => v && setForm({ ...form, categoryId: v })}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Course</Label>
                <Select value={form.courseId} onValueChange={(v) => setForm({ ...form, courseId: v ?? "" })}>
                  <SelectTrigger><SelectValue placeholder="All courses" /></SelectTrigger>
                  <SelectContent>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.sessionType} onValueChange={(v) => v && setForm({ ...form, sessionType: v as "recurring" | "one_off" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recurring">Recurring weekly</SelectItem>
                    <SelectItem value="one_off">One-off date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.sessionType === "recurring" ? (
                <div><Label>Day (0=Sun)</Label><Input type="number" min={0} max={6} value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })} /></div>
              ) : (
                <div><Label>Date</Label><Input type="date" value={form.sessionDate} onChange={(e) => setForm({ ...form, sessionDate: e.target.value })} /></div>
              )}
              <div><Label>Start</Label><Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
              <div><Label>End</Label><Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></div>
              <div className="flex items-end"><p className="text-sm text-muted-foreground">Auto duration: <strong className="text-icvf-navy">{formatMinutes(previewMinutes)}</strong></p></div>
            </div>
            <Button onClick={handleAdd} className="mt-4"><Plus className="mr-2 size-4" />Add Session</Button>
          </GlassCard>

          <CalendarBoard sessions={sessions} categories={categories} categoryFilter={categoryFilter} onCategoryFilter={setCategoryFilter} variant="light" />

          <AdminTable
            columns={[
              { key: "title", label: "Title" },
              { key: "categoryName", label: "Category" },
              { key: "sessionType", label: "Type" },
              { key: "durationMinutes", label: "Minutes" },
            ]}
            data={sessions}
            onDelete={handleDelete}
          />
        </>
      )}
    </div>
  );
}
