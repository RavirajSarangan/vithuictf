"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  addCourse,
  deleteCourse,
  moveCourseOrder,
  setCourseHomeVisibility,
  updateCourse,
  uploadCourseImage,
} from "@/lib/actions/admin";
import { createClient } from "@/lib/supabase/client";
import { CLASS_DAYS } from "@/lib/academics/constants";
import { bulkDeleteCourses } from "@/lib/actions/bulk-delete";
import { useAdminCourses } from "@/hooks/use-data";
import { AdminTableSection } from "@/components/admin/admin-table-section";
import { useBulkDeleteHandler } from "@/hooks/use-bulk-delete";
import { courseTableSummary, courseSelectionInsights } from "@/lib/table-insights";
import { AdminImageUpload } from "@/components/admin/admin-image-upload";
import { CourseThumbnail } from "@/components/courses/course-card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowDown, ArrowUp, BookOpen, Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Course, CourseLevel } from "@/types";

const courseSchema = z.object({
  name: z.string().min(3, "Course name is required"),
  category: z.string().min(2, "Category is required"),
  description: z.string().min(10, "Description is required"),
  durationMonths: z
    .number({ message: "Duration is required" })
    .min(1, "Duration is required")
    .max(36, "Duration must be 36 months or less"),
  classDays: z.array(z.string()),
  level: z.enum(["OL", "AL", "University", "Professional"]),
  teacherName: z.string().min(2, "Staff name is required"),
  coverImageUrl: z.union([z.string().url(), z.literal("")]).optional(),
});

type CourseFormValues = z.infer<typeof courseSchema>;

const CATEGORIES = [
  "Engineering",
  "Management",
  "Computer Science",
  "Design",
  "Data Science",
  "Emerging Technologies",
];

const DAY_LABELS = new Map<string, string>(CLASS_DAYS.map((day) => [day.id, day.label]));
const DAY_ORDER = new Map<string, number>(CLASS_DAYS.map((day, index) => [day.id, index]));

function formatClassDays(days: string[]): string {
  return [...days]
    .sort((a, b) => (DAY_ORDER.get(a) ?? 99) - (DAY_ORDER.get(b) ?? 99))
    .map((day) => DAY_LABELS.get(day) ?? day)
    .join(", ");
}

type CourseSchedule = { classDaysPerWeek: number; classDays: string[] };

export default function AdminCoursesPage() {
  const { data, refresh } = useAdminCourses();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [schedules, setSchedules] = useState<Map<string, CourseSchedule>>(new Map());
  const [reordering, setReordering] = useState(false);

  const handleBulkDelete = useBulkDeleteHandler(bulkDeleteCourses, "course", refresh);
  const summaryItems = useMemo(() => courseTableSummary(data), [data]);

  const sortedCourses = useMemo(
    () => [...data].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [data]
  );

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("course_schedule_summaries")
      .select("*")
      .then(({ data: rows }) => {
        setSchedules(
          new Map(
            (rows ?? []).map((row) => [
              row.course_id,
              { classDaysPerWeek: row.class_days_per_week, classDays: row.class_days },
            ])
          )
        );
      });
  }, [data]);

  const handleVisibilityToggle = async (course: Course, show: boolean) => {
    const result = await setCourseHomeVisibility(course.id, show);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(show ? `${course.name} shown on home page` : `${course.name} hidden from home page`);
    refresh();
  };

  const handleMove = async (course: Course, direction: "up" | "down") => {
    setReordering(true);
    try {
      const result = await moveCourseOrder(course.id, direction);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      refresh();
    } finally {
      setReordering(false);
    }
  };

  const courseColumns = useMemo(
    () => [
      {
        key: "coverImageUrl",
        label: "",
        render: (row: Course) => (
          <CourseThumbnail title={row.name} coverImageUrl={row.coverImageUrl} className="size-10" />
        ),
      },
      { key: "name", label: "Name", linkTo: (row: Course) => `/academics/courses/${row.id}` },
      {
        key: "category",
        label: "Category",
        render: (row: Course) => (
          <Badge variant="outline">{row.category ?? "—"}</Badge>
        ),
      },
      {
        key: "durationMonths",
        label: "Duration",
        render: (row: Course) =>
          row.durationMonths ? `${row.durationMonths} ${row.durationMonths === 1 ? "Month" : "Months"}` : "—",
      },
      {
        key: "classDays",
        label: "Class days",
        render: (row: Course) => {
          const batchSchedule = schedules.get(row.id);
          const schedule =
            batchSchedule && batchSchedule.classDaysPerWeek > 0
              ? batchSchedule
              : row.classDays?.length
                ? { classDaysPerWeek: row.classDays.length, classDays: row.classDays }
                : null;
          if (!schedule) {
            return <span className="text-muted-foreground">—</span>;
          }
          return (
            <div className="flex flex-col">
              <span>
                {schedule.classDaysPerWeek} {schedule.classDaysPerWeek === 1 ? "day" : "days"}/week
              </span>
              <span className="text-xs text-muted-foreground">{formatClassDays(schedule.classDays)}</span>
            </div>
          );
        },
      },
      { key: "teacherName", label: "Staff" },
      { key: "studentCount", label: "Students" },
      {
        key: "showOnHome",
        label: "Home",
        render: (row: Course) => (
          <span onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={row.showOnHome}
              onCheckedChange={(checked) => handleVisibilityToggle(row, checked)}
              aria-label={`Show ${row.name} on home page`}
            />
          </span>
        ),
      },
      {
        key: "sortOrder",
        label: "Order",
        render: (row: Course) => {
          const index = sortedCourses.findIndex((course) => course.id === row.id);
          return (
            <span className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={reordering || index <= 0}
                onClick={() => handleMove(row, "up")}
                aria-label={`Move ${row.name} up`}
              >
                <ArrowUp className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={reordering || index === sortedCourses.length - 1}
                onClick={() => handleMove(row, "down")}
                aria-label={`Move ${row.name} down`}
              >
                <ArrowDown className="size-3.5" />
              </Button>
            </span>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [schedules, sortedCourses, reordering]
  );

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: "",
      category: "Engineering",
      description: "",
      durationMonths: 12,
      classDays: [],
      level: "Professional",
      teacherName: "Vithoosan Sivanathan",
      coverImageUrl: "",
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({
      name: "",
      category: "Engineering",
      description: "",
      durationMonths: 12,
      classDays: [],
      level: "Professional",
      teacherName: "Vithoosan Sivanathan",
      coverImageUrl: "",
    });
    setOpen(true);
  };

  const openEdit = (course: Course) => {
    setEditing(course);
    form.reset({
      name: course.name,
      category: course.category ?? "Engineering",
      description: course.description,
      durationMonths: course.durationMonths ?? 12,
      classDays: course.classDays ?? [],
      level: course.level,
      teacherName: course.teacherName,
      coverImageUrl: course.coverImageUrl ?? "",
    });
    setOpen(true);
  };

  const onSubmit = async (values: CourseFormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        name: values.name,
        category: values.category,
        description: values.description,
        durationMonths: values.durationMonths,
        classDays: values.classDays,
        level: values.level as CourseLevel,
        teacherName: values.teacherName,
        coverImageUrl: values.coverImageUrl ?? "",
      };

      if (editing) {
        const result = await updateCourse(editing.id, payload);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success("Course updated");
      } else {
        const result = await addCourse(payload);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success("Course added");
      }
      refresh();
      setOpen(false);
    } catch {
      toast.error("Failed to save course");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const result = await deleteCourse(deleteTarget.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      refresh();
      toast.success("Course deleted");
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Courses"
        description="Manage the official ICT program catalog"
        action={
          <Button  onClick={openCreate}>
            <Plus className="mr-2 size-4" /> Add Course
          </Button>
        }
      />

      {data.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Add your first ICT program"
          action={
            <Button  onClick={openCreate}>
              <Plus className="mr-2 size-4" /> Add Course
            </Button>
          }
          
        />
      ) : (
        <AdminTableSection
          data={sortedCourses}
          columns={courseColumns}
          summaryItems={summaryItems}
          getSelectionInsights={courseSelectionInsights}
          entityLabel="course"
          onBulkDelete={handleBulkDelete}
          deleteWarning="Related batches, enrollments, and resources may also be removed."
          onDelete={(id) => setDeleteTarget(data.find((course) => course.id === id) ?? null)}
          onView={(row) => openEdit(row)}
          rowHref={(row) => `/academics/courses/${row.id}`}
          onActionComplete={refresh}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[min(90dvh,calc(100vh-2rem))] overflow-y-auto overscroll-contain sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Course" : "Add Course"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 pb-1">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Name</FormLabel>
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
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="durationMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (months)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={36}
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="classDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class days</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-3">
                        {CLASS_DAYS.map((day) => {
                          const checked = field.value.includes(day.id);
                          return (
                            <label
                              key={day.id}
                              className="flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(next) =>
                                  field.onChange(
                                    next
                                      ? [...field.value, day.id]
                                      : field.value.filter((d: string) => d !== day.id)
                                  )
                                }
                              />
                              {day.label}
                            </label>
                          );
                        })}
                      </div>
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Shown on the home page as “days/week” with a live next-class countdown. Batch
                      schedules override these once a batch exists.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="coverImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <AdminImageUpload
                        label="Course image"
                        folder="courses"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        uploadAction={uploadCourseImage}
                        requireSquare
                        hint="Square image recommended. JPG/PNG uploads are auto-converted to WebP (1024×1024)."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="teacherName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Staff name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit"  disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Saving...
                  </>
                ) : editing ? (
                  <>
                    <Pencil className="mr-2 size-4" /> Update Course
                  </>
                ) : (
                  "Save Course"
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name ?? "course"}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && deleteTarget.studentCount > 0
                ? `This will remove the course from the catalog and unenroll ${deleteTarget.studentCount} student${deleteTarget.studentCount === 1 ? "" : "s"}. Related batches, resources, and attendance records for this course will also be removed.`
                : "This will permanently remove the course from the catalog."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
