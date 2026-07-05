"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { GlassCard } from "@/components/shared/glass-card";
import {
  deleteQuiz,
  deleteQuizQuestion,
  getQuizEditor,
  saveQuizQuestion,
  updateQuiz,
} from "@/lib/actions/quizzes";
import { getActionErrorMessage } from "@/lib/action-error";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { ArrowLeft, Brain, Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import type { Quiz, QuizAttempt, QuizQuestion } from "@/types";

function QuestionForm({
  quizId,
  question,
  onDone,
  onCancel,
}: {
  quizId: string;
  question?: QuizQuestion;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [prompt, setPrompt] = useState(question?.prompt ?? "");
  const [options, setOptions] = useState<string[]>(question?.options ?? ["", ""]);
  const [correctIndex, setCorrectIndex] = useState(question?.correctIndex ?? 0);
  const [points, setPoints] = useState(String(question?.points ?? 1));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const result = await saveQuizQuestion({
      id: question?.id,
      quizId,
      prompt,
      options,
      correctIndex,
      points: Number(points) || 1,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(question ? "Question updated" : "Question added");
    onDone();
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4">
      <div className="grid gap-2">
        <Label>Question</Label>
        <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2} />
      </div>
      <div className="grid gap-2">
        <Label>Options — tick the correct one</Label>
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCorrectIndex(index)}
              className={`flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
                correctIndex === index
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-muted-foreground/30 text-muted-foreground hover:border-emerald-400"
              }`}
              aria-label={`Mark option ${index + 1} correct`}
            >
              <Check className="size-4" />
            </button>
            <Input
              value={option}
              onChange={(e) => {
                const next = [...options];
                next[index] = e.target.value;
                setOptions(next);
              }}
              placeholder={`Option ${index + 1}`}
            />
            {options.length > 2 ? (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => {
                  const next = options.filter((_, i) => i !== index);
                  setOptions(next);
                  if (correctIndex >= next.length) setCorrectIndex(0);
                }}
              >
                <X className="size-4" />
              </Button>
            ) : null}
          </div>
        ))}
        {options.length < 5 ? (
          <Button variant="outline" size="sm" className="self-start" onClick={() => setOptions([...options, ""])}>
            <Plus className="size-3.5" />
            Add option
          </Button>
        ) : null}
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="grid w-28 gap-2">
          <Label>Points</Label>
          <Input type="number" min={1} max={100} value={points} onChange={(e) => setPoints(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Save question
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function QuizEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [togglingPublish, setTogglingPublish] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await getQuizEditor(id);
      setQuiz(data.quiz);
      setQuestions(data.questions);
      setAttempts(data.attempts);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to load quiz"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handlePublishToggle(published: boolean) {
    if (!quiz) return;
    setTogglingPublish(true);
    const result = await updateQuiz(quiz.id, {
      title: quiz.title,
      description: quiz.description,
      timeLimitMinutes: quiz.timeLimitMinutes ?? null,
      maxAttempts: quiz.maxAttempts,
      published,
    });
    setTogglingPublish(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(published ? "Quiz published — students can now take it" : "Quiz unpublished");
    void refresh();
  }

  async function handleDeleteQuiz() {
    const result = await deleteQuiz(id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Quiz deleted");
    router.push("/academics/quizzes");
  }

  async function handleDeleteQuestion(questionId: string) {
    const result = await deleteQuizQuestion(questionId);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    void refresh();
  }

  if (loading) {
    return (
      <GlassCard className="flex items-center justify-center bg-white py-16">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </GlassCard>
    );
  }

  if (!quiz) {
    return <EmptyState icon={Brain} title="Quiz not found" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/academics/quizzes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All quizzes
      </Link>

      <PageHeader
        title={quiz.title}
        description={`${quiz.courseName ?? ""} · ${quiz.batchName ?? "Whole course"}${quiz.timeLimitMinutes ? ` · ${quiz.timeLimitMinutes} min` : ""} · ${quiz.maxAttempts === 0 ? "Unlimited attempts" : `${quiz.maxAttempts} attempt${quiz.maxAttempts === 1 ? "" : "s"}`}`}
        action={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={quiz.published}
                onCheckedChange={(checked) => void handlePublishToggle(Boolean(checked))}
                disabled={togglingPublish}
              />
              <span className="text-sm">{quiz.published ? "Published" : "Draft"}</span>
            </div>
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="destructive" size="icon">
                    <Trash2 className="size-4" />
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete quiz?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Removes the quiz, its {questions.length} questions, and {attempts.length} attempts.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void handleDeleteQuiz()}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      />

      <GlassCard className="bg-white">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Questions ({questions.length})</h3>
          {editing === null ? (
            <Button size="sm" onClick={() => setEditing("new")}>
              <Plus className="size-4" />
              Add question
            </Button>
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          {questions.map((question, index) =>
            editing === question.id ? (
              <QuestionForm
                key={question.id}
                quizId={id}
                question={question}
                onDone={() => {
                  setEditing(null);
                  void refresh();
                }}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <div key={question.id} className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {index + 1}. {question.prompt}
                    </p>
                    <ul className="mt-2 flex flex-col gap-1">
                      {question.options.map((option, optionIndex) => (
                        <li
                          key={optionIndex}
                          className={`flex items-center gap-2 text-sm ${
                            optionIndex === question.correctIndex
                              ? "font-medium text-emerald-700"
                              : "text-muted-foreground"
                          }`}
                        >
                          {optionIndex === question.correctIndex ? (
                            <Check className="size-3.5 shrink-0" />
                          ) : (
                            <span className="size-3.5 shrink-0" />
                          )}
                          {option}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Badge variant="outline">{question.points} pt{question.points === 1 ? "" : "s"}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => setEditing(question.id)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => void handleDeleteQuestion(question.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          )}

          {editing === "new" ? (
            <QuestionForm
              quizId={id}
              onDone={() => {
                setEditing(null);
                void refresh();
              }}
              onCancel={() => setEditing(null)}
            />
          ) : null}

          {questions.length === 0 && editing === null ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No questions yet — add the first one to get started.
            </p>
          ) : null}
        </div>
      </GlassCard>

      <GlassCard className="bg-white p-0">
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Attempts ({attempts.length})</h3>
        </div>
        {attempts.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No attempts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 text-right font-medium">Score</th>
                  <th className="px-4 py-3 text-right font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt) => (
                  <tr key={attempt.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">{attempt.studentName ?? "Student"}</p>
                      <p className="text-xs text-muted-foreground">{attempt.studentCode}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {attempt.score}/{attempt.maxScore}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      {new Date(attempt.completedAt).toLocaleString("en-GB", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
