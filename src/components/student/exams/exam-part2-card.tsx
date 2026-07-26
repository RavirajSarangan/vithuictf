"use client";

import { useState } from "react";
import { FileEdit, Loader2, Upload } from "lucide-react";
import { ProtectedPdfViewer } from "@/components/student/exams/protected-pdf-viewer";
import { submitWrittenAnswer } from "@/lib/actions/exam-written-submissions";
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
import { toast } from "sonner";
import type { Exam, ExamWrittenSubmission } from "@/types";

function formatDeadline(deadline: string): string {
  return new Date(deadline).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_BADGE: Record<ExamWrittenSubmission["status"], { label: string; className: string }> = {
  submitted: { label: "Submitted", className: "border-amber-200 bg-amber-50 text-amber-700" },
  reviewed: { label: "Under review", className: "border-sky-200 bg-sky-50 text-sky-700" },
  graded: { label: "Graded", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
};

export function ExamPart2Card({
  exam,
  mySubmission,
  onSubmitted,
}: {
  exam: Exam;
  mySubmission: ExamWrittenSubmission | null;
  onSubmitted: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const deadlinePassed =
    !!exam.writtenSubmissionDeadline && new Date(exam.writtenSubmissionDeadline).getTime() < Date.now();
  const canSubmit = mySubmission === null || mySubmission.status === "submitted";

  async function handleSubmit(formData: FormData) {
    formData.set("examId", exam.id);
    setSubmitting(true);
    const result = await submitWrittenAnswer(formData);
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Answer submitted");
    setDialogOpen(false);
    onSubmitted();
  }

  return (
    <div className="rounded-2xl border border-icvf-border bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-icvf-navy/10 text-icvf-navy">
            <FileEdit className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-icvf-navy sm:text-base">Part 2 — Written</p>
            <p className="text-xs text-icvf-text-light">
              View the question paper, write your answer offline, then scan and upload it.
            </p>
          </div>
        </div>
        {mySubmission ? (
          <Badge variant="outline" className={STATUS_BADGE[mySubmission.status].className}>
            {STATUS_BADGE[mySubmission.status].label}
          </Badge>
        ) : (
          <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
            Not submitted
          </Badge>
        )}
      </div>

      {exam.writtenSubmissionDeadline ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Deadline: {formatDeadline(exam.writtenSubmissionDeadline)}
          {deadlinePassed ? <span className="ml-1 font-medium text-red-600">(passed)</span> : null}
        </p>
      ) : null}

      {exam.writtenQuestionPaperPath ? (
        <div className="mt-4">
          <ProtectedPdfViewer signedUrlEndpoint={`/api/exams/${exam.id}/question-paper`} />
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">Question paper not uploaded yet.</p>
      )}

      {mySubmission?.status === "graded" ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2.5">
          <p className="text-xs font-semibold text-emerald-800">
            Score: {mySubmission.marks}/{exam.totalMarks}
          </p>
          {mySubmission.feedback ? (
            <p className="mt-0.5 text-sm text-emerald-900">{mySubmission.feedback}</p>
          ) : null}
        </div>
      ) : null}

      {canSubmit && !deadlinePassed ? (
        <Button
          size="sm"
          className="mt-4 bg-icvf-navy hover:bg-icvf-navy-hover"
          onClick={() => setDialogOpen(true)}
        >
          <Upload className="size-4" />
          {mySubmission ? "Replace submission" : "Upload answer"}
        </Button>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload your answer — {exam.title}</DialogTitle>
            <DialogDescription>
              Scan or photograph your written answer as a single PDF (20 MB max).
            </DialogDescription>
          </DialogHeader>
          <form action={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="written-answer-file">Answer PDF</Label>
              <Input id="written-answer-file" name="file" type="file" accept="application/pdf" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="written-answer-note">Note (optional)</Label>
              <Textarea id="written-answer-note" name="note" rows={3} placeholder="Anything your teacher should know" />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Submit
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
