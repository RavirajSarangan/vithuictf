"use client";

import { useEffect, useMemo } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateBatchSchedule } from "@/lib/actions/academics";
import { CLASS_DAYS } from "@/lib/academics/constants";
import { SchedulePreview } from "@/components/academics/schedule-preview";
import { scheduleSummary } from "@/lib/academics/schedule";
import type { CourseBatch } from "@/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const editBatchSchema = z.object({
  name: z.string().min(2, "Batch name is required"),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  classDays: z.array(z.string()).min(1, "Select at least one day"),
  zoomLink: z.string().optional(),
});

type EditBatchValues = z.infer<typeof editBatchSchema>;

interface BatchEditDialogProps {
  batch: CourseBatch;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasSessions: boolean;
  onSaved: () => void;
}

export function BatchEditDialog({
  batch,
  open,
  onOpenChange,
  hasSessions,
  onSaved,
}: BatchEditDialogProps) {
  const form = useForm<EditBatchValues>({
    resolver: zodResolver(editBatchSchema) as Resolver<EditBatchValues>,
    defaultValues: {
      name: batch.name,
      startDate: batch.startDate,
      endDate: batch.endDate,
      startTime: batch.startTime.slice(0, 5),
      endTime: batch.endTime.slice(0, 5),
      classDays: batch.classDays,
      zoomLink: batch.zoomLink ?? "",
    },
  });

  const watched = form.watch();
  const classDays = watched.classDays;

  const preview = useMemo(() => {
    if (!watched.startDate || !watched.endDate || !watched.classDays.length) {
      return { totalClasses: 0, firstDate: null, lastDate: null };
    }
    return scheduleSummary({
      startDate: watched.startDate,
      endDate: watched.endDate,
      startTime: watched.startTime,
      endTime: watched.endTime,
      classDays: watched.classDays,
    });
  }, [watched]);

  useEffect(() => {
    if (open) {
      form.reset({
        name: batch.name,
        startDate: batch.startDate,
        endDate: batch.endDate,
        startTime: batch.startTime.slice(0, 5),
        endTime: batch.endTime.slice(0, 5),
        classDays: batch.classDays,
        zoomLink: batch.zoomLink ?? "",
      });
    }
  }, [open, batch, form]);

  const onSubmit = async (values: EditBatchValues) => {
    if (preview.totalClasses === 0) {
      toast.error("No class days in the selected date range");
      return;
    }
    try {
      const syncResult = await updateBatchSchedule(batch.id, {
        ...values,
        totalClasses: preview.totalClasses,
      });
      onSaved();
      onOpenChange(false);
      if (syncResult) {
        toast.success(
          syncResult.preservedWithAttendance > 0
            ? `Batch updated. ${syncResult.synced} sessions synced (${syncResult.preservedWithAttendance} with attendance kept on original dates).`
            : `Batch updated. ${syncResult.synced} sessions synced.`
        );
      } else {
        toast.success("Batch updated");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit batch</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Course: {batch.courseName} · {batch.batchCode}
        </p>
        {hasSessions && (
          <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
            Schedule changes auto-update class sessions. Sessions with attendance keep their original
            dates.
          </p>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Batch name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormItem>
              <FormLabel>Class days</FormLabel>
              <div className="flex flex-wrap gap-3 pt-1">
                {CLASS_DAYS.map((day) => {
                  const checked = classDays.includes(day.id);
                  return (
                    <label key={day.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(next) => {
                          const current = form.getValues("classDays");
                          if (next) {
                            form.setValue("classDays", [...current, day.id], { shouldValidate: true });
                          } else {
                            form.setValue(
                              "classDays",
                              current.filter((d) => d !== day.id),
                              { shouldValidate: true }
                            );
                          }
                        }}
                      />
                      {day.label}
                    </label>
                  );
                })}
              </div>
            </FormItem>
            <SchedulePreview
              startDate={watched.startDate}
              endDate={watched.endDate}
              startTime={watched.startTime}
              endTime={watched.endTime}
              classDays={classDays}
              totalClasses={preview.totalClasses}
            />
            <FormField
              control={form.control}
              name="zoomLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zoom link</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://zoom.us/j/..." />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
