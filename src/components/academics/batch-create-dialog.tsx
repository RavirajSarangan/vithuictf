"use client";

import { useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { createBatch, previewBatchCode } from "@/lib/actions/academics";
import { buildSessionSchedule, scheduleSummary } from "@/lib/academics/schedule";
import { CLASS_DAYS } from "@/lib/academics/constants";
import { useAdminCourses } from "@/hooks/use-data";
import { BatchStudentEnrollPanel } from "@/components/academics/batch-student-enroll-panel";
import { CourseCard } from "@/components/courses/course-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const batchSchema = z.object({
  courseId: z.string().min(1, "Select a course"),
  name: z.string().min(2, "Batch name is required"),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  classDays: z.array(z.string()).min(1, "Select at least one day"),
  zoomLink: z.string().optional(),
});

type BatchFormValues = z.infer<typeof batchSchema>;
type Step = 1 | 2 | 3 | 4 | 5;

interface BatchCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function BatchCreateDialog({ open, onOpenChange, onCreated }: BatchCreateDialogProps) {
  const router = useRouter();
  const { data: courses } = useAdminCourses();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [batchCodePreview, setBatchCodePreview] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [setAsCurrentCourse, setSetAsCurrentCourse] = useState(false);

  const form = useForm<BatchFormValues>({
    resolver: zodResolver(batchSchema) as Resolver<BatchFormValues>,
    defaultValues: {
      courseId: "",
      name: "",
      startDate: "",
      endDate: "",
      startTime: "09:00",
      endTime: "12:00",
      classDays: ["mon", "wed", "fri"],
      zoomLink: "",
    },
  });

  const values = form.watch();
  const selectedCourse = courses.find((c) => c.id === values.courseId);

  const schedulePreview = useMemo(() => {
    if (!values.startDate || !values.endDate || !values.classDays.length) {
      return { totalClasses: 0, firstDate: null, lastDate: null, sessions: [] as ReturnType<typeof buildSessionSchedule> };
    }
    const summary = scheduleSummary({
      startDate: values.startDate,
      endDate: values.endDate,
      startTime: values.startTime,
      endTime: values.endTime,
      classDays: values.classDays,
    });
    const sessions = buildSessionSchedule({
      startDate: values.startDate,
      endDate: values.endDate,
      startTime: values.startTime,
      endTime: values.endTime,
      classDays: values.classDays,
      totalClasses: summary.totalClasses,
    });
    return { ...summary, sessions };
  }, [values]);

  const loadBatchCode = async (courseId: string) => {
    try {
      const code = await previewBatchCode(courseId);
      setBatchCodePreview(code);
    } catch {
      setBatchCodePreview("");
    }
  };

  const resetAll = () => {
    setStep(1);
    setSelectedStudentIds([]);
    setSetAsCurrentCourse(false);
    setBatchCodePreview("");
    form.reset();
  };

  const handleClose = (next: boolean) => {
    if (!next) resetAll();
    onOpenChange(next);
  };

  const onSubmit = async (formValues: BatchFormValues) => {
    if (schedulePreview.totalClasses === 0) {
      toast.error("No class days in the selected date range");
      return;
    }
    setSubmitting(true);
    try {
      const result = await createBatch({
        ...formValues,
        studentIds: selectedStudentIds,
        setAsCurrentCourse,
      });
      toast.success(
        `Batch ${result.batchCode} created with ${result.sessionsCreated} class sessions${
          result.enrolled ? ` · ${result.enrolled} students enrolled` : ""
        }`
      );
      onCreated?.();
      handleClose(false);
      router.push(`/academics/batches/${result.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create batch");
    } finally {
      setSubmitting(false);
    }
  };

  const canNextStep2 =
    values.startDate && values.endDate && values.classDays.length > 0 && schedulePreview.totalClasses > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add new batch — step {step} of 5</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {step === 1 && (
              <>
                <FormField
                  control={form.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(v) => {
                          field.onChange(v);
                          void loadBatchCode(v ?? "");
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select course" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {courses.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedCourse ? (
                        <div className="mt-3 max-w-sm">
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
                      {batchCodePreview ? (
                        <p className="text-sm text-muted-foreground">
                          Batch code preview: <Badge variant="outline">{batchCodePreview}</Badge>
                        </p>
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Evening Batch 2026" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button type="button" disabled={!values.courseId || !values.name} onClick={() => setStep(2)}>
                    Next
                  </Button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
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
                      const checked = values.classDays.includes(day.id);
                      return (
                        <label key={day.id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(next) => {
                              const current = form.getValues("classDays");
                              if (next) form.setValue("classDays", [...current, day.id], { shouldValidate: true });
                              else
                                form.setValue(
                                  "classDays",
                                  current.filter((d) => d !== day.id),
                                  { shouldValidate: true }
                                );
                            }}
                          />
                          {day.label}
                        </label>
                      );
                    })}
                  </div>
                </FormItem>
                <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
                  <p className="font-medium">{schedulePreview.totalClasses} class days (auto-calculated)</p>
                  {schedulePreview.firstDate && schedulePreview.lastDate ? (
                    <p className="text-muted-foreground">
                      First class {schedulePreview.firstDate} · Last class {schedulePreview.lastDate}
                    </p>
                  ) : (
                    <p className="text-destructive">No class days match this range</p>
                  )}
                </div>
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button type="button" disabled={!canNextStep2} onClick={() => setStep(3)}>
                    Next
                  </Button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <FormField
                  control={form.control}
                  name="zoomLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zoom link (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://zoom.us/j/..." />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Students will see this on their calendar and class reminders.
                      </p>
                    </FormItem>
                  )}
                />
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button type="button" onClick={() => setStep(4)}>
                    Next
                  </Button>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <BatchStudentEnrollPanel
                  courseId={values.courseId}
                  selectedIds={selectedStudentIds}
                  onSelectionChange={setSelectedStudentIds}
                  excludeEnrolledInBatchId={null}
                />
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={setAsCurrentCourse}
                    onCheckedChange={(v) => setSetAsCurrentCourse(v === true)}
                  />
                  Set this course as current course for enrolled students
                </label>
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(3)}>
                    Back
                  </Button>
                  <Button type="button" onClick={() => setStep(5)}>
                    Next
                  </Button>
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <div className="space-y-2 rounded-md border border-border p-4 text-sm">
                  <p>
                    <span className="text-muted-foreground">Course:</span> {selectedCourse?.name}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Batch:</span> {values.name}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Code:</span> {batchCodePreview || "Auto-generated"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Schedule:</span> {values.startDate} → {values.endDate},{" "}
                    {schedulePreview.totalClasses} classes
                  </p>
                  <p>
                    <span className="text-muted-foreground">Students to enroll:</span> {selectedStudentIds.length}
                  </p>
                </div>
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(4)}>
                    Back
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" /> Creating…
                      </>
                    ) : (
                      "Create batch"
                    )}
                  </Button>
                </div>
              </>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
