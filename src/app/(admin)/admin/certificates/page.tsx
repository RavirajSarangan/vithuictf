"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { issueCertificate } from "@/lib/actions/admin";
import { useAdminCertificates, useAdminCourses, useAdminStudents } from "@/hooks/use-data";
import { AdminTable } from "@/components/admin/admin-table";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Award, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";

const certificateSchema = z.object({
  studentId: z.string().min(1, "Select a student"),
  courseId: z.string().min(1, "Select a course"),
});

type CertificateFormValues = z.infer<typeof certificateSchema>;

export default function AdminCertificatesPage() {
  const { data, refresh } = useAdminCertificates();
  const { data: students } = useAdminStudents();
  const { data: courses } = useAdminCourses();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CertificateFormValues>({
    resolver: zodResolver(certificateSchema),
    defaultValues: { studentId: "", courseId: "" },
  });

  const onSubmit = async (values: CertificateFormValues) => {
    const student = students.find((s) => s.id === values.studentId);
    const course = courses.find((c) => c.id === values.courseId);
    if (!student || !course) {
      toast.error("Student or course not found");
      return;
    }

    setSubmitting(true);
    try {
      await issueCertificate({
        studentId: student.id,
        studentName: student.displayName,
        courseId: course.id,
        courseName: course.name,
      });
      refresh();
      setOpen(false);
      form.reset();
      toast.success("Certificate issued");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to issue certificate");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Certificates"
        description="Issue completion certificates to students"
        action={
          <Button className="bg-icvf-accent hover:bg-icvf-accent-hover" onClick={() => setOpen(true)}>
            <Plus className="mr-2 size-4" /> Issue Certificate
          </Button>
        }
      />

      {data.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No certificates yet"
          description="Issue certificates when students complete programs"
          action={
            <Button className="bg-icvf-accent" onClick={() => setOpen(true)}>
              <Plus className="mr-2 size-4" /> Issue Certificate
            </Button>
          }
          className="border-white/10 bg-white/5 text-white"
        />
      ) : (
        <AdminTable
          columns={[
            { key: "studentName", label: "Student" },
            { key: "courseName", label: "Course" },
            { key: "issuedAt", label: "Issued" },
            {
              key: "verifyCode",
              label: "Verify",
              render: (row) =>
                row.verifyCode ? (
                  <a
                    href={`/verify/${row.verifyCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-icvf-accent hover:underline"
                  >
                    {row.verifyCode}
                  </a>
                ) : (
                  "—"
                ),
            },
          ]}
          data={data}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Issue Certificate</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.displayName}
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
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="bg-icvf-accent" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Issuing...
                  </>
                ) : (
                  "Issue Certificate"
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
