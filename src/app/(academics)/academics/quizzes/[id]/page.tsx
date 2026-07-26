"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { GlassCard } from "@/components/shared/glass-card";
import { deleteQuiz, getQuizEditor, updateQuiz } from "@/lib/actions/quizzes";
import { QuizQuestionsEditor } from "@/components/academics/quizzes/quiz-questions-editor";
import { getActionErrorMessage } from "@/lib/action-error";
import { Button } from "@/components/ui/button";
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
import { ArrowLeft, Brain, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Quiz, QuizAttempt, QuizQuestion } from "@/types";

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

      <QuizQuestionsEditor quizId={id} questions={questions} onRefresh={() => void refresh()} />

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
