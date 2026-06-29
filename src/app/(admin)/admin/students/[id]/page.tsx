"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { deleteStudent, getStudent, resendStudentWelcomeEmail } from "@/lib/actions/admin";
import { mapStudent } from "@/lib/supabase/mappers";
import type { Student } from "@/types";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ArrowLeft, Loader2, Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatSriLankaWhatsAppDisplay } from "@/lib/validation/sri-lanka-phone";
import { StudentEnrollmentPanel } from "@/components/academics/student-enrollment-panel";
import { EnrollmentStatusBadge } from "@/components/academics/enrollment-status-badge";
import { approveStudentRegistration, rejectStudentRegistration } from "@/lib/actions/academics";
import { useAuth } from "@/providers/auth-provider";

export default function AdminStudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const id = params.id as string;
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const row = await getStudent(id);
        setStudent(row ? mapStudent(row) : null);
      } catch {
        setStudent(null);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  const handleResend = async () => {
    setResending(true);
    try {
      const result = await resendStudentWelcomeEmail(id);
      if (result.emailSent) {
        toast.success("Welcome email resent with new temporary password");
      } else {
        toast.warning(result.error ?? "Email not sent");
        toast.info(`New password: ${result.tempPassword}`, { duration: 10000 });
      }
      if (result.whatsappSent) {
        toast.success("Welcome WhatsApp resent");
      } else if (result.whatsappError) {
        toast.warning(`WhatsApp not sent: ${result.whatsappError}`, { duration: 10000 });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to resend email");
    } finally {
      setResending(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteStudent(id);
      toast.success("Student deleted");
      router.push("/admin/students");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64 bg-muted" />
        <Skeleton className="h-48 w-full bg-muted" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center text-muted-foreground">
        <p>Student not found</p>
        <Button nativeButton={false} render={<Link href="/admin/students" />} variant="ghost" className="mt-4 text-icvf-accent">
          <ArrowLeft className="mr-2 size-4" /> Back to Students
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/admin/students" />}>Students</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{student.displayName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title={student.displayName}
        description={`Student ID: ${student.studentId}`}
        action={
          <div className="flex flex-wrap gap-2">
            {student.registrationStatus === "pending" && isAdmin && (
              <>
                <Button
                  variant="default"
                  onClick={async () => {
                    try {
                      await approveStudentRegistration(student.id);
                      toast.success("Registration approved");
                      const row = await getStudent(id);
                      setStudent(row ? mapStudent(row) : null);
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Failed");
                    }
                  }}
                >
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    try {
                      await rejectStudentRegistration(student.id);
                      toast.success("Registration rejected");
                      const row = await getStudent(id);
                      setStudent(row ? mapStudent(row) : null);
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Failed");
                    }
                  }}
                >
                  Reject
                </Button>
              </>
            )}
            <Button variant="outline"  onClick={handleResend} disabled={resending}>
              {resending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Mail className="mr-2 size-4" />}
              Resend Welcome Email
            </Button>
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="destructive">
                    <Trash2 className="mr-2 size-4" /> Delete
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete student?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove {student.displayName}&apos;s record. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card >
          <CardHeader>
            <CardTitle className="text-base">Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Username</span>
              <span>{student.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Student ID</span>
              <span className="font-mono">{student.studentId}</span>
            </div>
            {student.phone ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">WhatsApp</span>
                <span>{formatSriLankaWhatsAppDisplay(student.phone)}</span>
              </div>
            ) : null}
            {student.schoolName ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">School</span>
                <span>{student.schoolName}</span>
              </div>
            ) : null}
            {student.nicNumber ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">NIC</span>
                <span className="font-mono">{student.nicNumber}</span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Course</span>
              <Badge className="bg-icvf-accent/20 text-icvf-accent">{student.courseName}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Registration</span>
              <EnrollmentStatusBadge status={student.registrationStatus ?? "approved"} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Grade</span>
              <span>{student.grade}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rank</span>
              <span>#{student.rank}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Points</span>
              <span>{student.points.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Performance</span>
              <span>{student.performance}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Enrollments</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentEnrollmentPanel
            student={student}
            onUpdated={async () => {
              const row = await getStudent(id);
              setStudent(row ? mapStudent(row) : null);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
