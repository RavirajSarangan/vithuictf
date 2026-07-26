"use client";

import { useCallback, useEffect, useState } from "react";
import {
  bulkReviewWrittenSubmissions,
  getExamWrittenSubmissions,
  reviewWrittenSubmission,
} from "@/lib/actions/exam-written-submissions";
import { getActionErrorMessage } from "@/lib/action-error";
import { GlassCard } from "@/components/shared/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ExamWrittenSubmission } from "@/types";

const STATUS_BADGE: Record<ExamWrittenSubmission["status"], { label: string; className: string }> = {
  submitted: { label: "Submitted", className: "border-amber-200 bg-amber-50 text-amber-700" },
  reviewed: { label: "Reviewed", className: "border-sky-200 bg-sky-50 text-sky-700" },
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

function SubmissionRow({
  submission,
  totalMarks,
  selected,
  onSelectChange,
  onReviewed,
}: {
  submission: ExamWrittenSubmission;
  totalMarks: number;
  selected: boolean;
  onSelectChange: (checked: boolean) => void;
  onReviewed: () => void;
}) {
  const [marks, setMarks] = useState(submission.marks?.toString() ?? "");
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [saving, setSaving] = useState(false);

  async function handleMarkReviewed() {
    setSaving(true);
    const result = await reviewWrittenSubmission(submission.id, { status: "reviewed" });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onReviewed();
  }

  async function handleGrade() {
    const parsed = Number(marks);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > totalMarks) {
      toast.error(`Marks must be between 0 and ${totalMarks}`);
      return;
    }
    setSaving(true);
    const result = await reviewWrittenSubmission(submission.id, {
      status: "graded",
      marks: parsed,
      feedback,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Submission graded — student notified");
    onReviewed();
  }

  const badge = STATUS_BADGE[submission.status];

  return (
    <div className="flex flex-col gap-3 border-b px-4 py-3.5 last:border-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-1 items-start gap-2">
        {submission.status === "submitted" ? (
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelectChange(checked === true)}
            className="mt-1 shrink-0"
            aria-label={`Select ${submission.studentName ?? "submission"}`}
          />
        ) : (
          <span className="mt-1 size-4 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-icvf-navy">{submission.studentName ?? "Student"}</p>
          <span className="text-xs text-muted-foreground">{submission.studentCode}</span>
          <Badge variant="outline" className={badge.className}>{badge.label}</Badge>
        </div>
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-xs"
          onClick={() => void openSignedFile(`/api/exam-written-submissions/${submission.id}/file`)}
        >
          <Eye className="mr-1 size-3.5" />
          {submission.fileName}
        </Button>
        {submission.note ? (
          <p className="mt-1 text-xs text-muted-foreground">{submission.note}</p>
        ) : null}
        </div>
      </div>

      {submission.status !== "graded" ? (
        <div className="flex flex-col gap-2 sm:w-72 sm:shrink-0">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={totalMarks}
              placeholder={`/ ${totalMarks}`}
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              className="h-8 w-24 text-sm"
            />
            {submission.status === "submitted" ? (
              <Button size="sm" variant="outline" disabled={saving} onClick={() => void handleMarkReviewed()}>
                Mark reviewed
              </Button>
            ) : null}
          </div>
          <Textarea
            placeholder="Feedback (optional)"
            rows={2}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="text-sm"
          />
          <Button size="sm" disabled={saving} onClick={() => void handleGrade()} className="self-start">
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Grade
          </Button>
        </div>
      ) : (
        <div className="text-right sm:w-72 sm:shrink-0">
          <p className="text-sm font-semibold text-icvf-navy">{submission.marks}/{totalMarks}</p>
          {submission.feedback ? (
            <p className="mt-1 text-xs text-muted-foreground">{submission.feedback}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function WrittenSubmissionsPanel({ examId, totalMarks }: { examId: string; totalMarks: number }) {
  const [submissions, setSubmissions] = useState<ExamWrittenSubmission[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setSubmissions(await getExamWrittenSubmissions(examId));
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to load submissions"));
      setSubmissions([]);
    }
  }, [examId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [submissions]);

  function toggleSelected(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleBulkMarkReviewed() {
    if (!selectedIds.size) return;
    setBulkSaving(true);
    const result = await bulkReviewWrittenSubmissions([...selectedIds]);
    setBulkSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`${selectedIds.size} submission${selectedIds.size === 1 ? "" : "s"} marked reviewed`);
    void load();
  }

  return (
    <GlassCard className="bg-white p-0">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Part 2 — Written submissions</h3>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 ? (
            <Button size="sm" variant="outline" disabled={bulkSaving} onClick={() => void handleBulkMarkReviewed()}>
              {bulkSaving ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Mark {selectedIds.size} selected as reviewed
            </Button>
          ) : null}
          <p className="text-xs text-muted-foreground">{submissions?.length ?? 0} submitted</p>
        </div>
      </div>
      {submissions === null ? (
        <div className="p-4">
          <Skeleton className="h-24 w-full bg-muted" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-muted-foreground">
          No written submissions yet.
        </div>
      ) : (
        submissions.map((submission) => (
          <SubmissionRow
            key={submission.id}
            submission={submission}
            totalMarks={totalMarks}
            selected={selectedIds.has(submission.id)}
            onSelectChange={(checked) => toggleSelected(submission.id, checked)}
            onReviewed={() => void load()}
          />
        ))
      )}
    </GlassCard>
  );
}
