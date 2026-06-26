"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addStudent, deleteStudent } from "@/lib/actions/admin";
import { useAdminCourses, useAdminStudents, useCurrentTeacher } from "@/hooks/use-data";
import { ExportCsvButton } from "@/components/admin/export-csv-button";
import { filterStudentsForTeacher } from "@/lib/teacher-scope";
import { useAuth } from "@/providers/auth-provider";
import { AdminTable } from "@/components/admin/admin-table";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";

const studentSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  courseId: z.string().min(1, "Select a course"),
});

type StudentFormValues = z.infer<typeof studentSchema>;

export default function AdminStudentsPage() {
  const { data: students, refresh } = useAdminStudents();
  const { data: courses } = useAdminCourses();
  const { user } = useAuth();
  const teacher = useCurrentTeacher();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const visibleStudents = useMemo(
    () => filterStudentsForTeacher(students, user?.role, teacher),
    [students, user?.role, teacher]
  );

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: { displayName: "", email: "", courseId: "" },
  });

  const handleAdd = async (values: StudentFormValues) => {
    const course = courses.find((c) => c.id === values.courseId);
    if (!course) {
      toast.error("Selected course not found");
      return;
    }

    setSubmitting(true);
    try {
      const result = await addStudent({
        displayName: values.displayName,
        email: values.email,
        courseId: course.id,
        courseName: course.name,
      });

      if (result.emailSent) {
        toast.success("Student registered and welcome email sent");
      } else {
        toast.warning(
          result.emailError
            ? `Student created but email failed: ${result.emailError}`
            : "Student created. Email service not configured."
        );
        if (result.tempPassword) {
          toast.info(`Temporary password: ${result.tempPassword}`, { duration: 10000 });
        }
      }
      refresh();
      setOpen(false);
      form.reset();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add student");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteStudent(id);
      refresh();
      toast.success("Student deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Students"
        description="Register students, assign courses, and manage accounts"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <ExportCsvButton
              rows={visibleStudents}
              filename="icvf-students.csv"
              columns={[
                { key: "displayName", label: "Name" },
                { key: "email", label: "Email" },
                { key: "studentId", label: "Student ID" },
                { key: "courseName", label: "Course" },
              ]}
            />
            <Button  onClick={() => setOpen(true)}>
              <Plus className="mr-2 size-4" /> Register Student
            </Button>
          </div>
        }
      />

      {visibleStudents.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students yet"
          description="Register your first student to get started"
          action={
            <Button  onClick={() => setOpen(true)}>
              <Plus className="mr-2 size-4" /> Register Student
            </Button>
          }
          
        />
      ) : (
        <AdminTable
          columns={[
            { key: "studentId", label: "ID" },
            {
              key: "displayName",
              label: "Name",
              linkTo: (row) => `/admin/students/${row.id}`,
            },
            { key: "email", label: "Email" },
            {
              key: "courseName",
              label: "Course",
              render: (row) => (
                <Badge variant="outline" >
                  {row.courseName}
                </Badge>
              ),
            },
            { key: "grade", label: "Grade" },
            { key: "rank", label: "Rank" },
          ]}
          data={visibleStudents}
          onDelete={handleDelete}
          viewHref={(row) => `/admin/students/${row.id}`}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Register New Student</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAdd)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (username)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="student@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a course" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name}
                            {course.category ? ` · ${course.category}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit"  disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Creating account...
                  </>
                ) : (
                  "Create Account & Send Email"
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
