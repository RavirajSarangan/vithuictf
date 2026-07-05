"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { GlassCard } from "@/components/shared/glass-card";
import { getAssignmentDetail, gradeSubmission, deleteAssignment } from "@/lib/actions/assignments";
import { getActionErrorMessage } from "@/lib/action-error";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { ArrowLeft, Download, Inbox, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Assignment, AssignmentSubmission } from "@/types";

async function openSignedFile(url: string) {
  try {
    const res = await fetch(url);
    const data = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !data.url) throw new Error(data.error ?? "Failed to open file");
    window.open(data.url, "_blank", "noopener");
  } catch (error) {
    toast.error(getActionErrorMessage(error, "Failed to open file"));
  }
}

function SubmissionRow({
  submission,
  maxMarks,
  onGraded,
}: {
  submission: AssignmentSubmission;
  maxMarks: number;
  onGraded: () => void;
}) {
  const [marks, setMarks] = useState(submission.marks?.toString() ?? "");
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [saving, setSaving] = useState(false);

  async function handleGrade() {
    const parsed = Number(marks);
    if (!Number.isFinite(parsed)) {
      toast.error("Enter marks before grading");
      return;
    }
    setSaving(true);
    const result = await gradeSubmission(submission.id, { marks: parsed, feedback });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`Graded ${submission.studentName ?? "student"} — student notified`);
    onGraded();
  }

  return (
    <tr className="border-b align-top last:border-0">
      <td className="px-4 py-3">
        <p className="font-medium text-icvf-navy">{submission.studentName ?? "Student"}</p>
        <p className="text-xs text-muted-foreground">{submission.studentCode}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {new Date(submission.submittedAt).toLocaleString("en-GB", {
            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
          })}
        </p>
      </td>
      <td className="px-4 py-3">
        {submission.filePath ? (
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => void openSignedFile(`/api/submissions/${submission.id}/file`)}
          >
            <Download className="size-3.5" />
            {submission.fileName ?? "File"}
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">No file</span>
        )}
        {submission.note ? (
          <p className="mt-1.5 max-w-56 text-xs text-muted-foreground">{submission.note}</p>
        ) : null}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min={0}
            max={maxMarks}
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
            className="h-8 w-20 text-sm"
          />
          <span className="text-xs text-muted-foreground">/ {maxMarks}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Feedback (optional)"
          rows={2}
          className="min-w-48 text-sm"
        />
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex flex-col items-end gap-1.5">
          <Badge variant={submission.status === "submitted" ? "outline" : "default"}>
            {submission.status === "submitted" ? "Awaiting" : "Graded"}
          </Badge>
          <Button size="sm" className="h-8 text-xs" onClick={() => void handleGrade()} disabled={saving}>
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
            {submission.status === "submitted" ? "Grade" : "Update"}
          </Button>
        </div>
      </td>
    </tr>
  );
}

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const detail = await getAssignmentDetail(id);
      setAssignment(detail.assignment);
      setSubmissions(detail.submissions);
      setEnrolledCount(detail.enrolledCount);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to load assignment"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteAssignment(id);
    setDeleting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Assignment deleted");
    router.push("/academics/assignments");
  }

  if (loading) {
    return (
      <GlassCard className="flex items-center justify-center bg-white py-16">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </GlassCard>
    );
  }

  if (!assignment) {
    return <EmptyState icon={Inbox} title="Assignment not found" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/academics/assignments"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All assignments
      </Link>

      <PageHeader
        title={assignment.title}
        description={`${assignment.courseName ?? ""}${assignment.batchName ? ` · ${assignment.batchName}` : ""} · Due ${new Date(assignment.dueAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} · ${assignment.maxMarks} marks`}
        action={
          <div className="flex items-center gap-2">
            {assignment.attachmentPath ? (
              <Button
                variant="outline"
                onClick={() => void openSignedFile(`/api/assignments/${assignment.id}/file`)}
              >
                <Download className="size-4" />
                Attachment
              </Button>
            ) : null}
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="destructive" disabled={deleting}>
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete assignment?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes the assignment and all {submissions.length} submissions permanently.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void handleDelete()}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      />

      {assignment.instructions ? (
        <GlassCard className="bg-white">
          <h3 className="mb-2 text-sm font-semibold">Instructions</h3>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{assignment.instructions}</p>
        </GlassCard>
      ) : null}

      <GlassCard className="bg-white p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Submissions</h3>
          <p className="text-xs text-muted-foreground">
            {submissions.length} of {enrolledCount} students submitted
          </p>
        </div>
        {submissions.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            No submissions yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Work</th>
                  <th className="px-4 py-3 font-medium">Marks</th>
                  <th className="px-4 py-3 font-medium">Feedback</th>
                  <th className="px-4 py-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <SubmissionRow
                    key={submission.id}
                    submission={submission}
                    maxMarks={assignment.maxMarks}
                    onGraded={() => void refresh()}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
