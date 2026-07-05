"use client";

import { useMemo, useState } from "react";
import { ClipboardList, Download, Loader2, Upload } from "lucide-react";
import { SectionCard } from "@/components/student/dashboard/section-card";
import { StudentEmptyState } from "@/components/student/portal/student-portal-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { submitAssignment } from "@/lib/actions/assignments";
import { getActionErrorMessage } from "@/lib/action-error";
import { cn } from "@/lib/utils";
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

function dueState(assignment: Assignment): "graded" | "submitted" | "overdue" | "open" {
  if (assignment.mySubmission?.status && assignment.mySubmission.status !== "submitted") return "graded";
  if (assignment.mySubmission) return "submitted";
  if (new Date(assignment.dueAt).getTime() < Date.now()) return "overdue";
  return "open";
}

const STATE_BADGES: Record<ReturnType<typeof dueState>, { label: string; className: string }> = {
  open: { label: "To do", className: "border-sky-200 bg-sky-50 text-sky-700" },
  overdue: { label: "Overdue", className: "border-red-200 bg-red-50 text-red-700" },
  submitted: { label: "Submitted", className: "border-amber-200 bg-amber-50 text-amber-700" },
  graded: { label: "Graded", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
};

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

export function StudentAssignmentsView({
  assignments,
  onRefresh,
}: {
  assignments: Assignment[];
  onRefresh: () => void;
}) {
  const [active, setActive] = useState<Assignment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const sorted = useMemo(() => {
    const order: Record<ReturnType<typeof dueState>, number> = {
      overdue: 0, open: 1, submitted: 2, graded: 3,
    };
    return [...assignments].sort((a, b) => {
      const stateDiff = order[dueState(a)] - order[dueState(b)];
      if (stateDiff !== 0) return stateDiff;
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    });
  }, [assignments]);

  if (!assignments.length) {
    return (
      <StudentEmptyState message="No assignments yet. New homework from your batches appears here." />
    );
  }

  async function handleSubmit(formData: FormData) {
    if (!active) return;
    formData.set("assignmentId", active.id);
    setSubmitting(true);
    const result = await submitAssignment(formData);
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Submission uploaded");
    setActive(null);
    onRefresh();
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {sorted.map((assignment) => {
          const state = dueState(assignment);
          const badge = STATE_BADGES[state];
          const submission = assignment.mySubmission;
          return (
            <SectionCard
              key={assignment.id}
              title={assignment.title}
              description={`${assignment.courseName ?? ""}${assignment.batchName ? ` · ${assignment.batchName}` : ""} · Due ${formatDue(assignment.dueAt)}`}
              icon={ClipboardList}
            >
              <div className="flex flex-col gap-3 px-4 py-3 sm:px-5 sm:py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={badge.className}>
                    {badge.label}
                  </Badge>
                  {state === "graded" && submission ? (
                    <Badge className="bg-icvf-navy text-white">
                      {submission.marks}/{assignment.maxMarks}
                    </Badge>
                  ) : null}
                  {assignment.attachmentPath ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => void openSignedFile(`/api/assignments/${assignment.id}/file`)}
                    >
                      <Download className="size-3.5" />
                      {assignment.attachmentName ?? "Attachment"}
                    </Button>
                  ) : null}
                </div>

                {assignment.instructions ? (
                  <p className="whitespace-pre-wrap text-sm text-icvf-text-light">
                    {assignment.instructions}
                  </p>
                ) : null}

                {state === "graded" && submission?.feedback ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2.5">
                    <p className="text-xs font-semibold text-emerald-800">Teacher feedback</p>
                    <p className="mt-0.5 text-sm text-emerald-900">{submission.feedback}</p>
                  </div>
                ) : null}

                {submission?.filePath ? (
                  <button
                    type="button"
                    onClick={() => void openSignedFile(`/api/submissions/${submission.id}/file`)}
                    className="self-start text-xs font-medium text-icvf-accent hover:underline"
                  >
                    Your file: {submission.fileName ?? "submission"}
                  </button>
                ) : null}

                {state !== "graded" ? (
                  <Button
                    size="sm"
                    className={cn("self-start", state === "submitted" ? "" : "bg-icvf-navy hover:bg-icvf-navy-hover")}
                    variant={state === "submitted" ? "outline" : "default"}
                    onClick={() => setActive(assignment)}
                  >
                    <Upload className="size-4" />
                    {state === "submitted" ? "Replace submission" : "Submit work"}
                  </Button>
                ) : null}
              </div>
            </SectionCard>
          );
        })}
      </div>

      <Dialog open={Boolean(active)} onOpenChange={(open) => { if (!open) setActive(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit — {active?.title}</DialogTitle>
            <DialogDescription>
              Upload your work as a file (20 MB max) and add an optional note.
            </DialogDescription>
          </DialogHeader>
          <form action={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="submission-file">File</Label>
              <Input id="submission-file" name="file" type="file" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="submission-note">Note (optional)</Label>
              <Textarea id="submission-note" name="note" rows={3} placeholder="Anything your teacher should know" />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Submit
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
