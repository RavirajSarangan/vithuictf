"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { GlassCard } from "@/components/shared/glass-card";
import { BatchPicker } from "@/components/academics/batch-picker";
import { useAdminCourses } from "@/hooks/use-data";
import { useFacultyBatches } from "@/hooks/use-faculty-academics";
import { createFacultyAssignment, getFacultyAssignments } from "@/lib/actions/faculty-assignments";
import { getActionErrorMessage } from "@/lib/action-error";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipboardList, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Assignment } from "@/types";

function formatDue(dueAt: string): string {
  return new Date(dueAt).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FacultyAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [batchId, setBatchId] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const { data: courses } = useAdminCourses();
  const { data: batches } = useFacultyBatches();

  const refresh = useCallback(async () => {
    try {
      setAssignments(await getFacultyAssignments());
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to load assignments"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectedCourse = courses.find((c) => c.id === courseId);

  async function handleCreate(formData: FormData) {
    if (!batchId) {
      toast.error("Select a batch for the assignment");
      return;
    }
    formData.set("batchId", batchId);
    setSubmitting(true);
    const result = await createFacultyAssignment(formData);
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Assignment created and students notified");
    formRef.current?.reset();
    setDialogOpen(false);
    setBatchId("");
    void refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Assignments"
        description="Post homework per batch, collect submissions, and grade them."
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button>
                  <Plus className="size-4" />
                  New assignment
                </Button>
              }
            />
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>New assignment</DialogTitle>
                <DialogDescription>
                  Students in the selected batch are notified as soon as it is posted.
                </DialogDescription>
              </DialogHeader>
              <form ref={formRef} action={handleCreate} className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label>Course</Label>
                  <Select value={courseId} onValueChange={(v) => { if (v) { setCourseId(v); setBatchId(""); } }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedCourse ? (
                  <div className="grid gap-2">
                    <Label>Batch</Label>
                    <BatchPicker
                      courseId={selectedCourse.id}
                      courseName={selectedCourse.name}
                      batches={batches}
                      value={batchId}
                      onChange={setBatchId}
                    />
                  </div>
                ) : null}
                <div className="grid gap-2">
                  <Label htmlFor="assignment-title">Title</Label>
                  <Input id="assignment-title" name="title" placeholder="e.g. Database design exercise" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="assignment-instructions">Instructions</Label>
                  <Textarea
                    id="assignment-instructions"
                    name="instructions"
                    placeholder="What should students do?"
                    rows={4}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="assignment-due">Due date</Label>
                    <Input id="assignment-due" name="dueAt" type="datetime-local" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="assignment-marks">Max marks</Label>
                    <Input id="assignment-marks" name="maxMarks" type="number" min={1} max={1000} defaultValue={100} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="assignment-file">Attachment (optional, 20 MB max)</Label>
                  <Input id="assignment-file" name="file" type="file" />
                </div>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                  Post assignment
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {loading ? (
        <GlassCard className="flex items-center justify-center bg-white py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </GlassCard>
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assignments yet"
          description="Post the first assignment for one of your batches."
        />
      ) : (
        <GlassCard className="bg-white p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Assignment</th>
                  <th className="px-4 py-3 font-medium">Batch</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                  <th className="px-4 py-3 text-right font-medium">Submissions</th>
                  <th className="px-4 py-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/faculty/assignments/${assignment.id}`}
                        className="font-medium text-icvf-navy hover:underline"
                      >
                        {assignment.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">{assignment.courseName}</p>
                    </td>
                    <td className="px-4 py-3">{assignment.batchName ?? "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDue(assignment.dueAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {assignment.submissionCount ?? 0}
                      <span className="text-xs text-muted-foreground">
                        {" "}({assignment.gradedCount ?? 0} graded)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant={assignment.published ? "default" : "outline"}>
                        {assignment.published ? "Published" : "Draft"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
