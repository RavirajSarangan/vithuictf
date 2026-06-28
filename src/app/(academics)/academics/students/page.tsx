"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/shared/page-header";
import { AdminTable } from "@/components/admin/admin-table";
import { useAcademicsStudents } from "@/hooks/use-academics";
import { useAdminCourses } from "@/hooks/use-data";
import { setStudentActive, updateStudent } from "@/lib/actions/academics";
import { useAuth } from "@/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import type { Student } from "@/types";
import { Loader2, Pencil, Users } from "lucide-react";
import { toast } from "sonner";

const editSchema = z.object({
  displayName: z.string().min(2),
  email: z.string().email(),
  courseId: z.string().min(1),
  phone: z.string().optional(),
  examYear: z.string().optional(),
  ictGrade: z.string().optional(),
});

export default function AcademicsStudentsPage() {
  const { data: students, loading, refresh } = useAcademicsStudents();
  const { data: courses } = useAdminCourses();
  const { user } = useAuth();
  const [editing, setEditing] = useState<Student | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const canDisable = user?.role === "admin" || user?.role === "super_admin";

  const form = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    defaultValues: { displayName: "", email: "", courseId: "", phone: "", examYear: "", ictGrade: "" },
  });

  const openEdit = (student: Student) => {
    setEditing(student);
    form.reset({
      displayName: student.displayName,
      email: student.email,
      courseId: student.courseId,
      phone: student.phone ?? "",
      examYear: student.examYear ?? "",
      ictGrade: student.ictGrade ?? "",
    });
  };

  const onSubmit = async (values: z.infer<typeof editSchema>) => {
    if (!editing) return;
    const course = courses.find((c) => c.id === values.courseId);
    setSubmitting(true);
    try {
      await updateStudent(editing.id, {
        displayName: values.displayName,
        email: values.email,
        courseId: values.courseId,
        courseName: course?.name ?? editing.courseName,
        phone: values.phone,
        examYear: values.examYear,
        ictGrade: values.ictGrade,
      });
      refresh();
      setEditing(null);
      toast.success("Student updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (student: Student) => {
    try {
      await setStudentActive(student.id, student.active === false);
      refresh();
      toast.success(student.active === false ? "Student enabled" : "Student disabled");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update status");
    }
  };

  const rows = useMemo(() => students, [students]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Students" description="Edit profiles, assign courses, and manage account access" />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading students…</p>
      ) : rows.length === 0 ? (
        <EmptyState icon={Users} title="No students" description="Students will appear here once registered" />
      ) : (
        <AdminTable
          columns={[
            { key: "studentId", label: "ID" },
            { key: "displayName", label: "Name" },
            { key: "email", label: "Email" },
            { key: "courseName", label: "Course" },
            {
              key: "active",
              label: "Status",
              render: (row) => (
                <Badge variant={row.active !== false ? "default" : "outline"}>
                  {row.active !== false ? "Active" : "Disabled"}
                </Badge>
              ),
            },
            {
              key: "id",
              label: "Actions",
              render: (row) => (
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => openEdit(row)}>
                    <Pencil className="mr-1 size-3.5" /> Edit
                  </Button>
                  {canDisable && (
                    <Button type="button" size="sm" variant="outline" onClick={() => void toggleActive(row)}>
                      {row.active === false ? "Enable" : "Disable"}
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          data={rows}
        />
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit student</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField control={form.control} name="displayName" render={({ field }) => (
                <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
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
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="examYear" render={({ field }) => (
                <FormItem><FormLabel>Exam year</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="ictGrade" render={({ field }) => (
                <FormItem><FormLabel>ICT grade</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <Button type="submit" disabled={submitting}>
                {submitting ? <><Loader2 className="mr-2 size-4 animate-spin" /> Saving…</> : "Save changes"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
