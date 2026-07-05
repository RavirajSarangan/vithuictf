"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { GlassCard } from "@/components/shared/glass-card";
import { BatchPicker } from "@/components/academics/batch-picker";
import { useAdminCourses } from "@/hooks/use-data";
import { useBatches } from "@/hooks/use-academics";
import { createQuiz, getStaffQuizzes } from "@/lib/actions/quizzes";
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
import { Brain, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Quiz } from "@/types";

export default function AcademicsQuizzesPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [courseId, setCourseId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [maxAttempts, setMaxAttempts] = useState("0");

  const { data: courses } = useAdminCourses();
  const { data: batches } = useBatches();
  const selectedCourse = courses.find((c) => c.id === courseId);

  const refresh = useCallback(async () => {
    try {
      setQuizzes(await getStaffQuizzes());
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to load quizzes"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleCreate() {
    if (!courseId) {
      toast.error("Select a course");
      return;
    }
    setSubmitting(true);
    const result = await createQuiz({
      courseId,
      batchId: batchId || null,
      title,
      description,
      timeLimitMinutes: timeLimit ? Number(timeLimit) : null,
      maxAttempts: Number(maxAttempts) || 0,
    });
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Quiz created — add questions, then publish");
    setDialogOpen(false);
    router.push(`/academics/quizzes/${result.id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Quizzes"
        description="MCQ practice for your courses — auto-marked, with scores feeding the leaderboard."
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button>
                  <Plus className="size-4" />
                  New quiz
                </Button>
              }
            />
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>New quiz</DialogTitle>
                <DialogDescription>
                  Created as a draft — students only see it once published.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
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
                    <Label>Batch (optional — leave empty for the whole course)</Label>
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
                  <Label htmlFor="quiz-title">Title</Label>
                  <Input
                    id="quiz-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Networking basics — practice MCQ"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quiz-description">Description</Label>
                  <Textarea
                    id="quiz-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="quiz-time">Time limit (minutes, optional)</Label>
                    <Input
                      id="quiz-time"
                      type="number"
                      min={1}
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="quiz-attempts">Max attempts (0 = unlimited)</Label>
                    <Input
                      id="quiz-attempts"
                      type="number"
                      min={0}
                      value={maxAttempts}
                      onChange={(e) => setMaxAttempts(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={() => void handleCreate()} disabled={submitting}>
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                  Create quiz
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {loading ? (
        <GlassCard className="flex items-center justify-center bg-white py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </GlassCard>
      ) : quizzes.length === 0 ? (
        <EmptyState
          icon={Brain}
          title="No quizzes yet"
          description="Create an MCQ practice quiz for one of your courses."
        />
      ) : (
        <GlassCard className="bg-white p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Quiz</th>
                  <th className="px-4 py-3 font-medium">Scope</th>
                  <th className="px-4 py-3 text-right font-medium">Questions</th>
                  <th className="px-4 py-3 text-right font-medium">Attempts</th>
                  <th className="px-4 py-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((quiz) => (
                  <tr key={quiz.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/academics/quizzes/${quiz.id}`}
                        className="font-medium text-icvf-navy hover:underline"
                      >
                        {quiz.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">{quiz.courseName}</p>
                    </td>
                    <td className="px-4 py-3">{quiz.batchName ?? "Whole course"}</td>
                    <td className="px-4 py-3 text-right">
                      {quiz.questionCount ?? 0}
                      <span className="text-xs text-muted-foreground"> ({quiz.totalPoints ?? 0} pts)</span>
                    </td>
                    <td className="px-4 py-3 text-right">{quiz.attemptCount ?? 0}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant={quiz.published ? "default" : "outline"}>
                        {quiz.published ? "Published" : "Draft"}
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
