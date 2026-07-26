"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { GlassCard } from "@/components/shared/glass-card";
import { BatchPicker } from "@/components/academics/batch-picker";
import { useAdminCourses } from "@/hooks/use-admin-data";
import { useBatches } from "@/hooks/use-academics";
import { createExam, createOnlineExam, getStaffExams } from "@/lib/actions/exams";
import { getStaffQuizzes } from "@/lib/actions/quizzes";
import { getActionErrorMessage } from "@/lib/action-error";
import { EXAM_TERMS, examStatusLabel, examStatusVariant } from "@/components/exams/exam-status";
import { useAuth } from "@/providers/auth-provider";
import {
  DraftQuestionBuilder,
  type DraftQuestion,
} from "@/components/academics/exams/draft-question-builder";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { FileText, Laptop, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Exam, Quiz } from "@/types";

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
  const { user } = useAuth();
  const isAcademicsStaff =
    user?.role === "admin" || user?.role === "teacher" || user?.role === "super_admin";

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

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [onlineDialogOpen, setOnlineDialogOpen] = useState(false);
  const [onlineSubmitting, setOnlineSubmitting] = useState(false);
  const [onlineCourseId, setOnlineCourseId] = useState("");
  const [onlineAuthoringMode, setOnlineAuthoringMode] = useState<"build" | "link">("build");
  const [onlineQuizId, setOnlineQuizId] = useState("");
  const [onlineQuestions, setOnlineQuestions] = useState<DraftQuestion[]>([]);
  const [onlineTimeLimit, setOnlineTimeLimit] = useState("");
  const [onlineMaxAttempts, setOnlineMaxAttempts] = useState("1");
  const [onlineWrittenEnabled, setOnlineWrittenEnabled] = useState(false);
  const [onlineTerm, setOnlineTerm] = useState(EXAM_TERMS[0]);
  const onlineFormRef = useRef<HTMLFormElement>(null);

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

  useEffect(() => {
    if (!isAcademicsStaff) return;
    getStaffQuizzes()
      .then(setQuizzes)
      .catch(() => setQuizzes([]));
  }, [isAcademicsStaff]);

  const selectedCourse = courses.find((c) => c.id === courseId);
  const quizzesForOnlineCourse = useMemo(
    () => quizzes.filter((q) => q.courseId === onlineCourseId),
    [quizzes, onlineCourseId]
  );

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

  async function handleCreateOnline(formData: FormData, published: boolean) {
    if (!onlineCourseId) {
      toast.error("Select a course for the online exam");
      return;
    }
    const hasMcq = onlineAuthoringMode === "build" ? onlineQuestions.length > 0 : Boolean(onlineQuizId);
    if (!hasMcq && !onlineWrittenEnabled) {
      toast.error("Enable at least one of Part 1 (MCQ) or Part 2 (written)");
      return;
    }
    if (published && onlineAuthoringMode === "build" && onlineQuestions.length === 0 && !onlineWrittenEnabled) {
      toast.error("Add at least one question before publishing");
      return;
    }
    formData.set("courseId", onlineCourseId);
    formData.set("term", onlineTerm);
    formData.set("authoringMode", onlineAuthoringMode);
    formData.set("quizId", onlineAuthoringMode === "link" ? onlineQuizId : "");
    formData.set("questions", JSON.stringify(onlineQuestions));
    formData.set("timeLimitMinutes", onlineTimeLimit);
    formData.set("maxAttempts", onlineMaxAttempts);
    formData.set("writtenEnabled", onlineWrittenEnabled ? "true" : "false");
    formData.set("published", published ? "true" : "false");

    setOnlineSubmitting(true);
    const result = await createOnlineExam(formData);
    setOnlineSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(published ? "Online exam published — students can see it now" : "Online exam saved as draft");
    onlineFormRef.current?.reset();
    setOnlineDialogOpen(false);
    setOnlineCourseId("");
    setOnlineAuthoringMode("build");
    setOnlineQuizId("");
    setOnlineQuestions([]);
    setOnlineTimeLimit("");
    setOnlineMaxAttempts("1");
    setOnlineWrittenEnabled(false);
    void refresh();
  }

  async function handleSaveOnlineDraft(formData: FormData) {
    await handleCreateOnline(formData, false);
  }

  async function handlePublishOnline(formData: FormData) {
    await handleCreateOnline(formData, true);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Exams"
        description="Schedule exams per batch, enter marks, and publish results."
        action={
          <div className="flex flex-wrap items-center gap-2">
          {isAcademicsStaff ? (
            <Dialog open={onlineDialogOpen} onOpenChange={setOnlineDialogOpen}>
              <DialogTrigger
                render={
                  <Button variant="outline">
                    <Laptop className="size-4" />
                    Create online exam
                  </Button>
                }
              />
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create online exam</DialogTitle>
                  <DialogDescription>
                    Pick one course — every student enrolled in it gets this exam in their portal.
                    Enable Part 1 (MCQ), Part 2 (written), or both.
                  </DialogDescription>
                </DialogHeader>
                <form ref={onlineFormRef} action={handleSaveOnlineDraft} className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label>Course</Label>
                    <Select
                      value={onlineCourseId}
                      onValueChange={(v) => { if (v) { setOnlineCourseId(v); setOnlineQuizId(""); } }}
                    >
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
                  <div className="grid gap-2">
                    <Label htmlFor="online-exam-title">Title</Label>
                    <Input id="online-exam-title" name="title" placeholder="e.g. Term 1 Online Exam" required />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="online-exam-subject">Subject</Label>
                      <Input id="online-exam-subject" name="subject" placeholder="e.g. ICT" required />
                    </div>
                    <div className="grid gap-2">
                      <Label>Term</Label>
                      <Select value={onlineTerm} onValueChange={(v) => { if (v) setOnlineTerm(v); }}>
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
                      <Label htmlFor="online-exam-date">Exam date</Label>
                      <Input id="online-exam-date" name="examDate" type="date" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="online-exam-total">Total marks</Label>
                      <Input id="online-exam-total" name="totalMarks" type="number" min={1} max={1000} defaultValue={100} />
                    </div>
                  </div>

                  <div className="rounded-xl border border-icvf-border p-3">
                    <Label>Part 1 — MCQ</Label>
                    <RadioGroup
                      value={onlineAuthoringMode}
                      onValueChange={(v) => setOnlineAuthoringMode(v as "build" | "link")}
                      className="mt-2 flex flex-col gap-2"
                    >
                      <label htmlFor="mode-build" className="flex cursor-pointer items-center gap-2 text-sm">
                        <RadioGroupItem id="mode-build" value="build" />
                        Build questions here
                      </label>
                      <label htmlFor="mode-link" className="flex cursor-pointer items-center gap-2 text-sm">
                        <RadioGroupItem id="mode-link" value="link" />
                        Link an existing quiz
                      </label>
                    </RadioGroup>

                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="online-exam-time-limit">Time limit (minutes, optional)</Label>
                        <Input
                          id="online-exam-time-limit"
                          type="number"
                          min={1}
                          value={onlineTimeLimit}
                          onChange={(e) => setOnlineTimeLimit(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="online-exam-max-attempts">Max attempts (0 = unlimited)</Label>
                        <Input
                          id="online-exam-max-attempts"
                          type="number"
                          min={0}
                          value={onlineMaxAttempts}
                          onChange={(e) => setOnlineMaxAttempts(e.target.value)}
                        />
                      </div>
                    </div>

                    {onlineAuthoringMode === "build" ? (
                      <div className="mt-3">
                        <DraftQuestionBuilder questions={onlineQuestions} onChange={setOnlineQuestions} />
                      </div>
                    ) : (
                      <Select value={onlineQuizId} onValueChange={(v) => setOnlineQuizId(v ?? "")}>
                        <SelectTrigger className="mt-3">
                          <SelectValue placeholder={onlineCourseId ? "Select quiz" : "Select a course first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {quizzesForOnlineCourse.map((quiz) => (
                            <SelectItem key={quiz.id} value={quiz.id}>
                              {quiz.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <div className="mt-3 grid gap-2">
                      <Label htmlFor="online-exam-mcq-paper">Reference paper (PDF, optional)</Label>
                      <p className="text-xs text-muted-foreground">
                        View-only for students, shown alongside the MCQ. Grading still uses the questions above.
                      </p>
                      <Input id="online-exam-mcq-paper" name="mcqQuestionPaper" type="file" accept="application/pdf" />
                    </div>
                  </div>

                  <div className="rounded-xl border border-icvf-border p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Part 2 — Written</Label>
                        <p className="text-xs text-muted-foreground">
                          Upload the question paper; students upload a scanned answer PDF.
                        </p>
                      </div>
                      <Switch checked={onlineWrittenEnabled} onCheckedChange={setOnlineWrittenEnabled} />
                    </div>
                    {onlineWrittenEnabled ? (
                      <div className="mt-3 flex flex-col gap-3">
                        <div className="grid gap-2">
                          <Label htmlFor="online-exam-paper">Question paper (PDF)</Label>
                          <Input id="online-exam-paper" name="writtenQuestionPaper" type="file" accept="application/pdf" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="online-exam-deadline">Submission deadline (optional)</Label>
                          <Input
                            id="online-exam-deadline"
                            name="writtenSubmissionDeadline"
                            type="datetime-local"
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" variant="outline" className="flex-1" disabled={onlineSubmitting}>
                      {onlineSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                      Save as draft
                    </Button>
                    <Button
                      type="submit"
                      formAction={handlePublishOnline}
                      className="flex-1"
                      disabled={onlineSubmitting}
                    >
                      {onlineSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                      Publish now
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          ) : null}
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
          </div>
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
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/academics/exams/${exam.id}`}
                          className="font-medium text-icvf-navy hover:underline"
                        >
                          {exam.title}
                        </Link>
                        {exam.isOnlineExam ? (
                          <Badge className="bg-icvf-navy/10 text-icvf-navy">Online</Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {exam.subject || exam.courseName} · {exam.totalMarks} marks
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {exam.batchName ?? (exam.isOnlineExam ? "Course-wide" : "—")}
                    </td>
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
