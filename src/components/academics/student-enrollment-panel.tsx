"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  enrollStudentInCourses,
  removeStudentFromBatch,
  setEnrollmentActive,
  setStudentPrimaryCourse,
  transferStudentBatch,
  type CourseBatchPair,
} from "@/lib/actions/academics";
import { useBatches, useStudentEnrollments } from "@/hooks/use-academics";
import { useAdminCourses } from "@/hooks/use-data";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CourseMultiSelect } from "@/components/academics/course-multi-select";
import { BatchPicker } from "@/components/academics/batch-picker";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Student } from "@/types";

type Props = {
  student: Student;
  onUpdated?: () => void;
};

export function StudentEnrollmentPanel({ student, onUpdated }: Props) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const { data: enrollments, loading } = useStudentEnrollments(student.id);
  const { data: courses } = useAdminCourses();
  const { data: batches } = useBatches();
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [batchByCourse, setBatchByCourse] = useState<Record<string, string>>({});
  const [transferBatchId, setTransferBatchId] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const enrolledCourseIds = useMemo(
    () => new Set(enrollments.map((e) => e.courseId)),
    [enrollments]
  );

  const availableCourses = useMemo(
    () => courses.filter((c) => !enrolledCourseIds.has(c.id)),
    [courses, enrolledCourseIds]
  );

  const handleAddCourses = async () => {
    if (!selectedCourseIds.length) {
      toast.error("Select at least one course");
      return;
    }
    const pairs: CourseBatchPair[] = [];
    for (const courseId of selectedCourseIds) {
      const batchId = batchByCourse[courseId];
      if (!batchId) {
        toast.error("Select a batch for each course");
        return;
      }
      pairs.push({ courseId, batchId });
    }
    setSubmitting(true);
    try {
      await enrollStudentInCourses(student.id, pairs, {
        setPrimaryCourseId: student.courseId || pairs[0]?.courseId,
      });
      toast.success("Courses added");
      setSelectedCourseIds([]);
      setBatchByCourse({});
      onUpdated?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enrollment failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransfer = async (enrollmentId: string, courseId: string) => {
    const targetBatchId = transferBatchId[enrollmentId];
    if (!targetBatchId) {
      toast.error("Select a target batch");
      return;
    }
    try {
      await transferStudentBatch(enrollmentId, targetBatchId);
      toast.success("Student transferred");
      onUpdated?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Transfer failed");
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading enrollments…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-3 text-sm font-medium">Current enrollments</h3>
        {enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Not enrolled in any batch yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {enrollments.map((e) => (
              <div key={e.enrollmentId} className="rounded-lg border p-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{e.course.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.course.level} · {e.course.teacherName}
                      {e.course.durationMonths ? ` · ${e.course.durationMonths} mo` : ""}
                    </p>
                    <p className="mt-1 text-xs">
                      Batch:{" "}
                      <Link href={`/academics/batches/${e.batch.id}`} className="underline">
                        {e.batch.name}
                      </Link>{" "}
                      ({e.batch.batchCode})
                    </p>
                    <p className="text-xs text-muted-foreground">Code: {e.enrollmentCode}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {e.isPrimary && <Badge>Primary</Badge>}
                    <Badge variant={e.active ? "default" : "outline"}>
                      {e.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {!e.isPrimary && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await setStudentPrimaryCourse(student.id, e.courseId);
                          toast.success("Primary course updated");
                          onUpdated?.();
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Failed");
                        }
                      }}
                    >
                      Set primary
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        await setEnrollmentActive(e.enrollmentId, !e.active);
                        toast.success(e.active ? "Enrollment deactivated" : "Enrollment activated");
                        onUpdated?.();
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Failed");
                      }
                    }}
                  >
                    {e.active ? "Deactivate" : "Activate"}
                  </Button>
                  {isAdmin && (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={async () => {
                        try {
                          await removeStudentFromBatch(e.enrollmentId);
                          toast.success("Removed from batch");
                          onUpdated?.();
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Failed");
                        }
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-end gap-2 border-t pt-3">
                  <div className="min-w-[200px] flex-1">
                    <BatchPicker
                      courseId={e.courseId}
                      courseName={e.course.name}
                      batches={batches.filter(
                        (b) => b.courseId === e.courseId && b.id !== e.batch.id
                      )}
                      value={transferBatchId[e.enrollmentId]}
                      onChange={(batchId) =>
                        setTransferBatchId((prev) => ({ ...prev, [e.enrollmentId]: batchId }))
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => handleTransfer(e.enrollmentId, e.courseId)}
                  >
                    Transfer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {availableCourses.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium">Add courses</h3>
          <CourseMultiSelect
            courses={availableCourses}
            selectedIds={selectedCourseIds}
            onChange={setSelectedCourseIds}
          />
          {selectedCourseIds.length > 0 && (
            <div className="mt-3 flex flex-col gap-3">
              {selectedCourseIds.map((courseId) => {
                const course = courses.find((c) => c.id === courseId);
                if (!course) return null;
                return (
                  <div key={courseId}>
                    <p className="mb-1 text-xs font-medium">{course.name}</p>
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
              <Button type="button" disabled={submitting} onClick={handleAddCourses}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Enrolling…
                  </>
                ) : (
                  "Enroll in selected courses"
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
