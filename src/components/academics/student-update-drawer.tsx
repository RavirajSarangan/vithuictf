"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  approveStudentRegistration,
  rejectStudentRegistration,
  setStudentActive,
  updateStudent,
} from "@/lib/actions/academics";
import { resendStudentWelcomeEmail } from "@/lib/actions/admin";
import { StudentEnrollmentPanel } from "@/components/academics/student-enrollment-panel";
import { EnrollmentStatusBadge } from "@/components/academics/enrollment-status-badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/providers/auth-provider";
import type { Student } from "@/types";
import { Loader2, Mail, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const profileSchema = z.object({
  displayName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  examYear: z.string().optional(),
  ictGrade: z.string().optional(),
});

type Props = {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
};

export function StudentUpdateDrawer({ student, open, onOpenChange, onUpdated }: Props) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      email: "",
      phone: "",
      examYear: "",
      ictGrade: "",
    },
  });

  useEffect(() => {
    if (student) {
      form.reset({
        displayName: student.displayName,
        email: student.email,
        phone: student.phone ?? "",
        examYear: student.examYear ?? "",
        ictGrade: student.ictGrade ?? "",
      });
    }
  }, [student, form]);

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!student) return;
    setSubmitting(true);
    try {
      await updateStudent(student.id, {
        displayName: values.displayName,
        email: values.email,
        whatsapp: values.phone,
        examYear: values.examYear,
        ictGrade: values.ictGrade,
      });
      toast.success("Student updated");
      onUpdated?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!student) return;
    try {
      await approveStudentRegistration(student.id);
      toast.success("Registration approved and student enrolled");
      onUpdated?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Approval failed");
    }
  };

  const handleReject = async () => {
    if (!student) return;
    try {
      await rejectStudentRegistration(student.id);
      toast.success("Registration rejected");
      onUpdated?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Rejection failed");
    }
  };

  const handleResend = async () => {
    if (!student) return;
    setResending(true);
    try {
      const result = await resendStudentWelcomeEmail(student.id);
      if (result.emailSent) toast.success("Welcome email resent");
      else toast.warning(result.error ?? "Email not sent");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setResending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {student && (
          <>
            <SheetHeader>
              <SheetTitle>{student.displayName}</SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-2">
                <span>{student.studentId}</span>
                <EnrollmentStatusBadge status={student.registrationStatus ?? "approved"} />
                {student.active === false && <Badge variant="outline">Disabled</Badge>}
              </SheetDescription>
            </SheetHeader>

            <Tabs defaultValue="profile" className="mt-4 px-1">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
                <TabsTrigger value="account">Account</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="mt-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>WhatsApp</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="examYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exam year</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ictGrade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ICT grade</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" /> Saving…
                        </>
                      ) : (
                        "Save profile"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="enrollments" className="mt-4">
                <StudentEnrollmentPanel student={student} onUpdated={onUpdated} />
              </TabsContent>

              <TabsContent value="account" className="mt-4 space-y-4">
                {student.registrationStatus === "pending" && isAdmin && (
                  <div className="flex gap-2">
                    <Button type="button" onClick={handleApprove}>
                      Approve registration
                    </Button>
                    <Button type="button" variant="destructive" onClick={handleReject}>
                      Reject
                    </Button>
                  </div>
                )}
                {isAdmin && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      try {
                        await setStudentActive(student.id, student.active === false);
                        toast.success(student.active === false ? "Student enabled" : "Student disabled");
                        onUpdated?.();
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Failed");
                      }
                    }}
                  >
                    {student.active === false ? "Enable account" : "Disable account"}
                  </Button>
                )}
                <Button type="button" variant="outline" disabled={resending} onClick={handleResend}>
                  {resending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 size-4" />
                  )}
                  Resend welcome email
                </Button>
                <Button type="button" variant="ghost" render={<Link href={`/admin/students/${student.id}`} />}>
                  <ExternalLink className="mr-2 size-4" /> Full profile page
                </Button>
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
