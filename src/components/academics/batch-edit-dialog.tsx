"use client";

import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateBatchSchedule } from "@/lib/actions/academics";
import { CLASS_DAYS } from "@/lib/academics/constants";
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
  totalClasses: z.number().min(1).max(52),
  classDays: z.array(z.string()).min(1, "Select at least one day"),
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
      totalClasses: batch.totalClasses,
      classDays: batch.classDays,
    },
  });

  const classDays = form.watch("classDays");

  useEffect(() => {
    if (open) {
      form.reset({
        name: batch.name,
        startDate: batch.startDate,
        endDate: batch.endDate,
        startTime: batch.startTime.slice(0, 5),
        endTime: batch.endTime.slice(0, 5),
        totalClasses: batch.totalClasses,
        classDays: batch.classDays,
      });
    }
  }, [open, batch, form]);

  const onSubmit = async (values: EditBatchValues) => {
    try {
      const syncResult = await updateBatchSchedule(batch.id, values);
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
            dates; times are always updated. Sessions without attendance are rescheduled or removed to
            match the new schedule.
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
                    <FormMessage />
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="totalClasses"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total classes</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={52}
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              <FormMessage>{form.formState.errors.classDays?.message}</FormMessage>
            </FormItem>
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
