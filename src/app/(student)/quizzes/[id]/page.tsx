"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Brain, Check, Clock, Loader2, X } from "lucide-react";
import {
  StudentEmptyState,
  StudentPageHeader,
  StudentPageLoading,
} from "@/components/student/portal/student-portal-states";
import { getQuizForTaking, submitQuizAttempt } from "@/lib/actions/quizzes";
import { getActionErrorMessage } from "@/lib/action-error";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Quiz, QuizQuestion } from "@/types";

type QuizResult = {
  score: number;
  maxScore: number;
  results: { questionId: string; correctIndex: number; chosenIndex: number | null; correct: boolean }[];
};

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function TakeQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const response = await getQuizForTaking(id);
      if (cancelled) return;
      if (!response.ok) {
        setLoadError(response.error);
      } else {
        setQuiz(response.quiz);
        setQuestions(response.questions);
        if (response.quiz.timeLimitMinutes) {
          setSecondsLeft(response.quiz.timeLimitMinutes * 60);
        }
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    const response = await submitQuizAttempt(id, answers);
    setSubmitting(false);
    if (!response.ok) {
      submittingRef.current = false;
      toast.error(getActionErrorMessage(response.error, "Failed to submit quiz"));
      return;
    }
    setResult(response);
    setSecondsLeft(null);
  }, [id, answers]);

  useEffect(() => {
    if (secondsLeft === null || result) return;
    if (secondsLeft <= 0) {
      toast.info("Time's up — submitting your answers");
      void handleSubmit();
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => (s === null ? null : s - 1)), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, result, handleSubmit]);

  if (loading) return <StudentPageLoading rows={2} />;

  if (loadError || !quiz) {
    return (
      <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-6">
        <Link href="/quizzes" className="inline-flex items-center gap-1.5 text-sm text-icvf-text-light hover:text-icvf-navy">
          <ArrowLeft className="size-4" />
          All quizzes
        </Link>
        <StudentEmptyState message={loadError ?? "Quiz not found."} />
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-6">
      <Link href="/quizzes" className="inline-flex items-center gap-1.5 text-sm text-icvf-text-light hover:text-icvf-navy">
        <ArrowLeft className="size-4" />
        All quizzes
      </Link>

      <StudentPageHeader
        title={quiz.title}
        description={quiz.description || `${quiz.courseName ?? ""} practice quiz`}
        action={
          secondsLeft !== null && !result ? (
            <Badge
              variant="outline"
              className={cn(
                "gap-1.5 px-3 py-1.5 text-sm",
                secondsLeft <= 60 ? "border-red-200 bg-red-50 text-red-700" : "border-icvf-border"
              )}
            >
              <Clock className="size-3.5" />
              {formatClock(secondsLeft)}
            </Badge>
          ) : undefined
        }
      />

      {result ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-icvf-border bg-white px-4 py-6 text-center shadow-sm">
          <div className="flex size-14 items-center justify-center rounded-full bg-icvf-navy/10 text-icvf-navy">
            <Brain className="size-6" />
          </div>
          <p className="text-2xl font-bold text-icvf-navy sm:text-3xl">
            {result.score} / {result.maxScore}
          </p>
          <p className="text-sm text-icvf-text-light">
            {result.score === result.maxScore
              ? "Perfect score — excellent work!"
              : result.score >= result.maxScore / 2
                ? "Good effort — review the answers below."
                : "Keep practicing — review the answers below."}
          </p>
        </div>
      ) : null}

      <ol className="flex flex-col gap-4">
        {questions.map((question, index) => {
          const chosen = answers[question.id];
          const questionResult = result?.results.find((r) => r.questionId === question.id);
          return (
            <li
              key={question.id}
              className="rounded-2xl border border-icvf-border bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-icvf-navy sm:text-base">
                  {index + 1}. {question.prompt}
                </p>
                <Badge variant="outline" className="shrink-0">
                  {question.points} pt{question.points === 1 ? "" : "s"}
                </Badge>
              </div>
              <div className="flex flex-col gap-2">
                {question.options.map((option, optionIndex) => {
                  const isChosen = chosen === optionIndex;
                  const isCorrect = questionResult?.correctIndex === optionIndex;
                  const showWrong = questionResult && isChosen && !questionResult.correct;
                  return (
                    <button
                      key={optionIndex}
                      type="button"
                      disabled={Boolean(result) || submitting}
                      onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }))}
                      className={cn(
                        "flex min-h-11 items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors",
                        result
                          ? isCorrect
                            ? "border-emerald-300 bg-emerald-50 font-medium text-emerald-800"
                            : showWrong
                              ? "border-red-300 bg-red-50 text-red-800"
                              : "border-icvf-border text-icvf-text-light"
                          : isChosen
                            ? "border-icvf-navy bg-icvf-navy/5 font-medium text-icvf-navy"
                            : "border-icvf-border hover:border-icvf-navy/30 hover:bg-icvf-surface"
                      )}
                    >
                      <span>{option}</span>
                      {result ? (
                        isCorrect ? (
                          <Check className="size-4 shrink-0 text-emerald-600" />
                        ) : showWrong ? (
                          <X className="size-4 shrink-0 text-red-600" />
                        ) : null
                      ) : isChosen ? (
                        <Check className="size-4 shrink-0" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>

      {!result ? (
        <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-2xl border border-icvf-border bg-white/95 px-4 py-3 shadow-lg backdrop-blur sm:px-5">
          <p className="text-sm text-icvf-text-light">
            {answeredCount}/{questions.length} answered
          </p>
          <Button
            onClick={() => void handleSubmit()}
            disabled={submitting || answeredCount === 0}
            className="bg-icvf-navy hover:bg-icvf-navy-hover"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Submit quiz
          </Button>
        </div>
      ) : (
        <Button
          nativeButton={false}
          render={<Link href="/quizzes" />}
          variant="outline"
          className="self-center"
        >
          Back to quizzes
        </Button>
      )}
    </div>
  );
}
