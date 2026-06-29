"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addStudent, deleteStudent } from "@/lib/actions/admin";
import { useAdminCourses, useAdminStudents, useCurrentTeacher } from "@/hooks/use-data";
import { useEnrollmentOverview } from "@/hooks/use-academics";
import { ExportCsvButton } from "@/components/admin/export-csv-button";
import { StudentSearchBar } from "@/components/academics/student-search-bar";
import { StudentUpdateDrawer } from "@/components/academics/student-update-drawer";
import { CourseMultiSelect } from "@/components/academics/course-multi-select";
import { BatchPicker } from "@/components/academics/batch-picker";
import { EnrollmentStatusBadge } from "@/components/academics/enrollment-status-badge";
import { filterStudentsForTeacher } from "@/lib/teacher-scope";
import {
  filterStudentsWithEnrollments,
  sortStudents,
  type StudentSearchFilters,
} from "@/lib/academics/student-search";
import { useAuth } from "@/providers/auth-provider";
import { AdminTable } from "@/components/admin/admin-table";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import {
  formatNicInput,
  isValidNic,
  normalizeNic,
} from "@/lib/validation/register-student";
import { normalizeSriLankaWhatsApp } from "@/lib/validation/sri-lanka-phone";
import { useBatches } from "@/hooks/use-academics";
import type { Student } from "@/types";

const studentSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  whatsapp: z
    .string()
    .min(1, "WhatsApp number is required")
    .refine((val) => Boolean(normalizeSriLankaWhatsApp(val)), {
      message: "Enter a valid Sri Lankan mobile number (e.g. 07X XXX XXXX)",
    }),
  schoolName: z.string().min(2, "School name is required"),
  nicNumber: z
    .string()
    .optional()
    .refine((val) => !val?.trim() || isValidNic(normalizeNic(val)), {
      message: "Enter a valid NIC number (e.g. 123456789V or 200012345678)",
    }),
  courseIds: z.array(z.string()).min(1, "Select at least one course"),
});

type StudentFormValues = z.infer<typeof studentSchema>;

export default function AdminStudentsPage() {
  const { data: students, refresh } = useAdminStudents();
  const { data: overview, refresh: refreshOverview } = useEnrollmentOverview();
  const { data: courses } = useAdminCourses();
  const { data: batches } = useBatches();
  const { user } = useAuth();
  const teacher = useCurrentTeacher();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState<StudentSearchFilters>({});
  const [drawerStudent, setDrawerStudent] = useState<Student | null>(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [batchByCourse, setBatchByCourse] = useState<Record<string, string>>({});

  const visibleStudents = useMemo(
    () => filterStudentsForTeacher(students, user?.role, teacher),
    [students, user?.role, teacher]
  );

  const overviewRows = useMemo(() => {
    const visibleIds = new Set(visibleStudents.map((s) => s.id));
    return overview.filter((r) => visibleIds.has(r.student.id));
  }, [overview, visibleStudents]);

  const filteredRows = useMemo(() => {
    const rows = filterStudentsWithEnrollments(overviewRows, filters);
    return sortStudents(rows, "pending_first");
  }, [overviewRows, filters]);

  const filteredStudents = useMemo(
    () => filteredRows.map((r) => r.student),
    [filteredRows]
  );

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      displayName: "",
      email: "",
      whatsapp: "",
      schoolName: "",
      nicNumber: "",
      courseIds: [],
    },
  });

  const handleRefresh = () => {
    refresh();
    refreshOverview();
  };

  const handleAdd = async (values: StudentFormValues) => {
    const primary = courses.find((c) => c.id === values.courseIds[0]);
    if (!primary) {
      toast.error("Selected course not found");
      return;
    }

    setSubmitting(true);
    try {
      const result = await addStudent({
        displayName: values.displayName,
        email: values.email,
        courseIds: values.courseIds,
        courseId: primary.id,
        courseName: primary.name,
        batchIds: batchByCourse,
        whatsapp: values.whatsapp,
        schoolName: values.schoolName,
        nicNumber: values.nicNumber?.trim() || undefined,
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

      if (result.whatsappSent) {
        toast.success("Welcome WhatsApp sent");
      } else if (result.whatsappError) {
        toast.warning(`WhatsApp not sent: ${result.whatsappError}`, { duration: 10000 });
      }
      handleRefresh();
      setOpen(false);
      form.reset();
      setSelectedCourseIds([]);
      setBatchByCourse({});
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add student");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteStudent(id);
      handleRefresh();
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
            <Button variant="outline" render={<Link href="/academics/enrollments" />}>
              Enrollments
            </Button>
            <ExportCsvButton
              rows={filteredStudents}
              filename="icvf-students.csv"
              columns={[
                { key: "displayName", label: "Name" },
                { key: "email", label: "Email" },
                { key: "phone", label: "WhatsApp" },
                { key: "schoolName", label: "School" },
                { key: "nicNumber", label: "NIC" },
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

      <StudentSearchBar
        filters={filters}
        onChange={setFilters}
        courses={courses}
        batches={batches}
      />

      {filteredStudents.length === 0 ? (
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
              render: (row) => (
                <button
                  type="button"
                  className="text-left font-medium underline-offset-2 hover:underline"
                  onClick={() => setDrawerStudent(row)}
                >
                  {row.displayName}
                </button>
              ),
            },
            { key: "email", label: "Email" },
            {
              key: "courseName",
              label: "Course",
              render: (row) => {
                const count = overviewRows.find((r) => r.student.id === row.id)?.enrollmentCount ?? 0;
                return (
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">{row.courseName}</Badge>
                    {count > 1 && <Badge variant="secondary">{count} courses</Badge>}
                  </div>
                );
              },
            },
            {
              key: "registrationStatus",
              label: "Registration",
              render: (row) => (
                <EnrollmentStatusBadge status={row.registrationStatus ?? "approved"} />
              ),
            },
            { key: "grade", label: "Grade" },
            { key: "rank", label: "Rank" },
          ]}
          data={filteredStudents}
          onDelete={handleDelete}
          viewHref={(row) => `/admin/students/${row.id}`}
        />
      )}

      <StudentUpdateDrawer
        student={drawerStudent}
        open={!!drawerStudent}
        onOpenChange={(v) => !v && setDrawerStudent(null)}
        onUpdated={handleRefresh}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="07X XXX XXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="schoolName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Jaffna Hindu College" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nicNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIC Number (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123456789V or 200012345678"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(formatNicInput(e.target.value))}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Sri Lankan NIC: 9 digits + V/X, or the new 12-digit format.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="courseIds"
                render={() => (
                  <FormItem>
                    <FormLabel>Courses</FormLabel>
                    <CourseMultiSelect
                      courses={courses}
                      selectedIds={selectedCourseIds}
                      onChange={(ids) => {
                        setSelectedCourseIds(ids);
                        form.setValue("courseIds", ids, { shouldValidate: true });
                      }}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              {selectedCourseIds.map((courseId) => {
                const course = courses.find((c) => c.id === courseId);
                if (!course) return null;
                return (
                  <div key={courseId}>
                    <p className="mb-1 text-xs font-medium">Batch for {course.name} (optional)</p>
                    <BatchPicker
                      courseId={courseId}
                      courseName={course.name}
                      batches={batches}
                      value={batchByCourse[courseId]}
                      onChange={(batchId) =>
                        setBatchByCourse((prev) => ({ ...prev, [courseId]: batchId }))
                      }
                    />
                  </div>
                );
              })}
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
