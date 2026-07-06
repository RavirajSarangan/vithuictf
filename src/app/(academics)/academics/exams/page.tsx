"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { GlassCard } from "@/components/shared/glass-card";
import { BatchPicker } from "@/components/academics/batch-picker";
import { useAdminCourses } from "@/hooks/use-data";
import { useBatches } from "@/hooks/use-academics";
import { createExam, getStaffExams } from "@/lib/actions/exams";
import { getActionErrorMessage } from "@/lib/action-error";
import { EXAM_TERMS, examStatusLabel, examStatusVariant } from "@/components/exams/exam-status";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { FileText, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Exam } from "@/types";

function formatExamDate(date: string, startTime?: string | null): string {
  const label = new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  if (!startTime) return label;
  return `${label} · ${startTime.slice(0, 5)}`;
}

export default function AcademicsExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [term, setTerm] = useState(EXAM_TERMS[0]);
  const formRef = useRef<HTMLFormElement>(null);

  const { data: courses } = useAdminCourses();
  const { data: batches } = useBatches();

  const refresh = useCallback(async () => {
    try {
      setExams(await getStaffExams());
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to load exams"));
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
      toast.error("Select a batch for the exam");
      return;
    }
    setSubmitting(true);
    const result = await createExam({
      batchId,
      title: String(formData.get("title") ?? ""),
      subject: String(formData.get("subject") ?? ""),
      examDate: String(formData.get("examDate") ?? ""),
      startTime: String(formData.get("startTime") ?? "") || undefined,
      totalMarks: Number(formData.get("totalMarks") ?? 100),
      term,
      weight: Number(formData.get("weight") ?? 1),
    });
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Exam scheduled and students notified");
    formRef.current?.reset();
    setDialogOpen(false);
    setBatchId("");
    void refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Exams"
        description="Schedule exams per batch, enter marks, and publish results."
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button>
                  <Plus className="size-4" />
                  Schedule exam
                </Button>
              }
            />
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Schedule exam</DialogTitle>
                <DialogDescription>
                  Students in the selected batch are notified as soon as it is scheduled.
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
                  <Label htmlFor="exam-title">Title</Label>
                  <Input id="exam-title" name="title" placeholder="e.g. First term test" required />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="exam-subject">Subject</Label>
                    <Input id="exam-subject" name="subject" placeholder="e.g. ICT" required />
                  </div>
                  <div className="grid gap-2">
                    <Label>Term</Label>
                    <Select value={term} onValueChange={(v) => { if (v) setTerm(v); }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXAM_TERMS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="exam-date">Exam date</Label>
                    <Input id="exam-date" name="examDate" type="date" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="exam-time">Start time (optional)</Label>
                    <Input id="exam-time" name="startTime" type="time" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="exam-total">Total marks</Label>
                    <Input id="exam-total" name="totalMarks" type="number" min={1} max={1000} defaultValue={100} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="exam-weight">Weight in report card</Label>
                    <Input id="exam-weight" name="weight" type="number" min={0.25} max={10} step={0.25} defaultValue={1} />
                  </div>
                </div>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                  Schedule exam
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
      ) : exams.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No exams yet"
          description="Schedule the first exam for one of your batches."
        />
      ) : (
        <GlassCard className="bg-white p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Exam</th>
                  <th className="px-4 py-3 font-medium">Batch</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Term</th>
                  <th className="px-4 py-3 text-right font-medium">Marks entered</th>
                  <th className="px-4 py-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/academics/exams/${exam.id}`}
                        className="font-medium text-icvf-navy hover:underline"
                      >
                        {exam.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {exam.subject || exam.courseName} · {exam.totalMarks} marks
                      </p>
                    </td>
                    <td className="px-4 py-3">{exam.batchName ?? "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatExamDate(exam.date, exam.startTime)}
                    </td>
                    <td className="px-4 py-3">{exam.term}</td>
                    <td className="px-4 py-3 text-right">
                      {exam.marksEnteredCount ?? 0}
                      <span className="text-xs text-muted-foreground"> / {exam.studentCount ?? 0}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant={examStatusVariant(exam.status)}>{examStatusLabel(exam.status)}</Badge>
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
