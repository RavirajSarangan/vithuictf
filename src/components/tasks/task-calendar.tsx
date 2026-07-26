"use client";

import { useMemo, useState } from "react";
import type { PersonalTask } from "@/lib/actions/personal-tasks";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { toggleTaskCompleted } from "@/lib/actions/personal-tasks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function TaskCalendar({ tasks, onChanged }: { tasks: PersonalTask[]; onChanged: () => void }) {
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());

  const tasksByDate = useMemo(() => {
    const map = new Map<string, PersonalTask[]>();
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const list = map.get(task.dueDate) ?? [];
      list.push(task);
      map.set(task.dueDate, list);
    }
    return map;
  }, [tasks]);

  const taskDates = useMemo(
    () => [...tasksByDate.keys()].map(parseDateOnly),
    [tasksByDate]
  );

  const selectedKey = selectedDay ? dateKey(selectedDay) : "";
  const selectedTasks = selectedKey ? tasksByDate.get(selectedKey) ?? [] : [];

  async function handleToggle(task: PersonalTask) {
    const result = await toggleTaskCompleted(task.id, !task.completed);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onChanged();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(280px,320px)_1fr]">
      <Calendar
        mode="single"
        selected={selectedDay}
        onSelect={setSelectedDay}
        modifiers={{ hasTask: taskDates }}
        modifiersClassNames={{
          hasTask:
            "relative font-semibold after:absolute after:bottom-1 after:left-1/2 after:size-1.5 after:-translate-x-1/2 after:rounded-full after:bg-icvf-accent",
        }}
        className="rounded-lg border border-border"
      />
      <div className="space-y-3">
        <h3 className="font-semibold">
          {selectedDay
            ? selectedDay.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })
            : "Select a day"}
        </h3>
        {selectedTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks due on this day.</p>
        ) : (
          selectedTasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                "flex items-start gap-3 rounded-md border border-border p-3 text-sm",
                task.completed && "opacity-60"
              )}
            >
              <Checkbox checked={task.completed} onCheckedChange={() => void handleToggle(task)} className="mt-0.5" />
              <div>
                <p className={cn("font-medium", task.completed && "line-through")}>{task.title}</p>
                {task.dueTime ? (
                  <p className="text-xs text-muted-foreground">{task.dueTime.slice(0, 5)}</p>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
