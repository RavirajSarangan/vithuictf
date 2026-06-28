"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { AdminTable } from "@/components/admin/admin-table";
import { useBatches } from "@/hooks/use-academics";
import { useAdminCourses } from "@/hooks/use-data";
import { createBatch } from "@/lib/actions/academics";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { CourseCard, CourseThumbnail } from "@/components/courses/course-card";
import { Layers, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { CLASS_DAYS } from "@/lib/academics/constants";

const batchSchema = z.object({
  courseId: z.string().min(1, "Select a course"),
  name: z.string().min(2, "Batch name is required"),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  totalClasses: z.number().min(1).max(52),
  classDays: z.array(z.string()).min(1, "Select at least one day"),
});

type BatchFormValues = z.infer<typeof batchSchema>;

export default function AcademicsBatchesPage() {
  const { data, loading, refresh } = useBatches();
  const { data: courses } = useAdminCourses();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<BatchFormValues>({
    resolver: zodResolver(batchSchema) as Resolver<BatchFormValues>,
    defaultValues: {
      courseId: "",
      name: "",
      startDate: "",
      endDate: "",
      startTime: "09:00",
      endTime: "12:00",
      totalClasses: 10,
      classDays: ["mon", "wed", "fri"],
    },
  });

  const classDays = form.watch("classDays");
  const selectedCourseId = form.watch("courseId");
  const selectedCourse = courses.find((course) => course.id === selectedCourseId);

  const onSubmit = async (values: BatchFormValues) => {
    setSubmitting(true);
    try {
      const result = await createBatch(values);
      refresh();
      setOpen(false);
      form.reset();
      toast.success(`Batch created (${result.batchCode})`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create batch");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Batches"
        description="Create course batches with schedules and auto-generated class sessions"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 size-4" /> New batch
          </Button>
        }
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading batches…</p>
      ) : data.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No batches yet"
          description="Create your first batch to enroll students and track attendance"
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 size-4" /> New batch
            </Button>
          }
        />
      ) : (
        <AdminTable
          columns={[
            {
              key: "courseCoverImageUrl",
              label: "",
              render: (row) => (
                <CourseThumbnail
                  title={row.courseName ?? row.name}
                  coverImageUrl={row.courseCoverImageUrl}
                  className="size-10"
                />
              ),
            },
            {
              key: "name",
              label: "Batch",
              render: (row) => (
                <Link href={`/academics/batches/${row.id}`} className="font-medium text-icvf-navy hover:underline">
                  {row.name}
                </Link>
              ),
            },
            { key: "batchCode", label: "Code" },
            { key: "courseName", label: "Course" },
            {
              key: "startDate",
              label: "Schedule",
              render: (row) => `${row.startDate} → ${row.endDate}`,
            },
            {
              key: "totalClasses",
              label: "Classes",
              render: (row) => String(row.totalClasses),
            },
            {
              key: "active",
              label: "Status",
              render: (row) => (
                <Badge variant={row.active ? "default" : "outline"}>{row.active ? "Active" : "Archived"}</Badge>
              ),
            },
          ]}
          data={data}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create batch</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField control={form.control} name="courseId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {courses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCourse ? (
                    <div className="mt-3 max-w-xs">
                      <CourseCard
                        compact
                        title={selectedCourse.name}
                        description={selectedCourse.description}
                        coverImageUrl={selectedCourse.coverImageUrl}
                        category={selectedCourse.category}
                        durationMonths={selectedCourse.durationMonths}
                      />
                    </div>
                  ) : null}
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Batch name</FormLabel><FormControl><Input {...field} placeholder="Evening Batch 2026" /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="startDate" render={({ field }) => (
                  <FormItem><FormLabel>Start date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="endDate" render={({ field }) => (
                  <FormItem><FormLabel>End date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="startTime" render={({ field }) => (
                  <FormItem><FormLabel>Start time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="endTime" render={({ field }) => (
                  <FormItem><FormLabel>End time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="totalClasses" render={({ field }) => (
                <FormItem><FormLabel>Total classes</FormLabel><FormControl><Input type="number" min={1} max={52} {...field} onChange={(e) => field.onChange(e.target.valueAsNumber || 0)} /></FormControl><FormMessage /></FormItem>
              )} />
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
                            if (next) form.setValue("classDays", [...current, day.id], { shouldValidate: true });
                            else form.setValue("classDays", current.filter((d) => d !== day.id), { shouldValidate: true });
                          }}
                        />
                        {day.label}
                      </label>
                    );
                  })}
                </div>
                <FormMessage>{form.formState.errors.classDays?.message}</FormMessage>
              </FormItem>
              <Button type="submit" disabled={submitting}>
                {submitting ? <><Loader2 className="mr-2 size-4 animate-spin" /> Creating…</> : "Create batch"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
