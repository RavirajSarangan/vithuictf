"use client";

import { useCallback, useEffect, useState } from "react";
import { getMyTasks, type PersonalTask } from "@/lib/actions/personal-tasks";
import { getMyNotes, type PersonalNote } from "@/lib/actions/personal-notes";
import { getActionErrorMessage } from "@/lib/action-error";
import { PageHeader } from "@/components/shared/page-header";
import { GlassCard } from "@/components/shared/glass-card";
import { TaskList } from "@/components/tasks/task-list";
import { TaskCalendar } from "@/components/tasks/task-calendar";
import { NotesPanel } from "@/components/tasks/notes-panel";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export function TasksView() {
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"list" | "calendar" | "notes">("list");

  const refresh = useCallback(async () => {
    try {
      const [taskRows, noteRows] = await Promise.all([getMyTasks(), getMyNotes()]);
      setTasks(taskRows);
      setNotes(noteRows);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to load tasks"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tasks & notes"
        description="Personal to your account — a to-do list, calendar, and notepad only you can see."
        action={
          <TaskFormDialog
            onSaved={refresh}
            trigger={
              <Button>
                <Plus className="size-4" />
                New task
              </Button>
            }
          />
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <TabsContent value="list">
              <GlassCard className="mt-4">
                <TaskList tasks={tasks} onChanged={refresh} />
              </GlassCard>
            </TabsContent>
            <TabsContent value="calendar">
              <GlassCard className="mt-4">
                <TaskCalendar tasks={tasks} onChanged={refresh} />
              </GlassCard>
            </TabsContent>
            <TabsContent value="notes">
              <GlassCard className="mt-4">
                <NotesPanel notes={notes} onChanged={refresh} />
              </GlassCard>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
