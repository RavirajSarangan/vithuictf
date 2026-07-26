"use client";

import { deletePersonalTask, toggleTaskCompleted, type PersonalTask } from "@/lib/actions/personal-tasks";
import { getActionErrorMessage } from "@/lib/action-error";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { CheckSquare, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

function formatDue(dueDate: string | null, dueTime: string | null): string | null {
  if (!dueDate) return null;
  const label = new Date(`${dueDate}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return dueTime ? `${label}, ${dueTime.slice(0, 5)}` : label;
}

export function TaskList({ tasks, onChanged }: { tasks: PersonalTask[]; onChanged: () => void }) {
  async function handleToggle(task: PersonalTask) {
    const result = await toggleTaskCompleted(task.id, !task.completed);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onChanged();
  }

  async function handleDelete(task: PersonalTask) {
    try {
      const result = await deletePersonalTask(task.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Task deleted");
      onChanged();
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to delete task"));
    }
  }

  if (!tasks.length) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="No tasks yet"
        description="Add a personal task to keep track of what you need to do."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {tasks.map((task) => {
        const due = formatDue(task.dueDate, task.dueTime);
        return (
          <div
            key={task.id}
            className={cn(
              "flex items-start gap-3 rounded-xl border border-icvf-border p-3",
              task.completed && "opacity-60"
            )}
          >
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => void handleToggle(task)}
              className="mt-1"
            />
            <div className="min-w-0 flex-1">
              <p className={cn("font-medium", task.completed && "line-through")}>{task.title}</p>
              {task.description ? (
                <p className="mt-0.5 text-sm text-muted-foreground">{task.description}</p>
              ) : null}
              {due ? <p className="mt-1 text-xs text-muted-foreground">Due {due}</p> : null}
            </div>
            <div className="flex shrink-0 gap-1">
              <TaskFormDialog
                task={task}
                onSaved={onChanged}
                trigger={
                  <Button type="button" variant="ghost" size="icon">
                    <Pencil className="size-4" />
                  </Button>
                }
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => void handleDelete(task)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
