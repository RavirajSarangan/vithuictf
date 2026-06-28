"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addCourse, deleteCourse, updateCourse, uploadCourseImage } from "@/lib/actions/admin";
import { useAdminCourses } from "@/hooks/use-data";
import { AdminTable } from "@/components/admin/admin-table";
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
import { BookOpen, Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Course, CourseLevel } from "@/types";

const courseSchema = z.object({
  name: z.string().min(3, "Course name is required"),
  category: z.string().min(2, "Category is required"),
  description: z.string().min(10, "Description is required"),
  durationMonths: z.number().min(1).max(36),
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

export default function AdminCoursesPage() {
  const { data, refresh } = useAdminCourses();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: "",
      category: "Engineering",
      description: "",
      durationMonths: 12,
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
        <AdminTable
          columns={[
            {
              key: "coverImageUrl",
              label: "",
              render: (row) => (
                <CourseThumbnail title={row.name} coverImageUrl={row.coverImageUrl} className="size-10" />
              ),
            },
            { key: "name", label: "Name" },
            {
              key: "category",
              label: "Category",
              render: (row) => (
                <Badge variant="outline" >
                  {row.category ?? "—"}
                </Badge>
              ),
            },
            {
              key: "durationMonths",
              label: "Duration",
              render: (row) => (row.durationMonths ? `${row.durationMonths} Months` : "—"),
            },
            { key: "teacherName", label: "Staff" },
            { key: "studentCount", label: "Students" },
          ]}
          data={data}
          onDelete={(id) => setDeleteTarget(data.find((course) => course.id === id) ?? null)}
          onView={(row) => openEdit(row)}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Course" : "Add Course"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
                        hint="Best: 1024×1024 px square (WebP or JPEG, under 500 KB)."
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
