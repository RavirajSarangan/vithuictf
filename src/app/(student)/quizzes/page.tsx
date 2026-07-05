"use client";

import Link from "next/link";
import { Brain, ChevronRight } from "lucide-react";
import { useStudentData } from "@/hooks/use-data";
import { useStudentQuizzes } from "@/hooks/use-student-data";
import {
  StudentEmptyState,
  StudentPageHeader,
  StudentPageLoading,
} from "@/components/student/portal/student-portal-states";
import { Badge } from "@/components/ui/badge";
import type { Quiz } from "@/types";

function attemptsLabel(quiz: Quiz): string {
  if (quiz.maxAttempts === 0) return "Unlimited attempts";
  const left = Math.max(0, quiz.maxAttempts - (quiz.myAttemptCount ?? 0));
  return `${left} of ${quiz.maxAttempts} attempt${quiz.maxAttempts === 1 ? "" : "s"} left`;
}

export default function StudentQuizzesPage() {
  const student = useStudentData();
  const { quizzes, loading } = useStudentQuizzes(student?.id);

  if (student === undefined || loading) {
    return <StudentPageLoading rows={2} />;
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-6">
      <StudentPageHeader
        title="Practice quizzes"
        description="Auto-marked MCQ practice for your courses. Scores add to your leaderboard points."
      />

      {quizzes.length === 0 ? (
        <StudentEmptyState message="No quizzes available yet — new practice quizzes appear here once your teacher publishes them." />
      ) : (
        <ul className="flex flex-col gap-3">
          {quizzes.map((quiz) => {
            const exhausted =
              quiz.maxAttempts > 0 && (quiz.myAttemptCount ?? 0) >= quiz.maxAttempts;
            return (
              <li key={quiz.id}>
                <Link
                  href={`/quizzes/${quiz.id}`}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-icvf-border bg-white px-4 py-3.5 shadow-sm transition-colors hover:border-icvf-navy/20 hover:bg-icvf-surface sm:px-5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-icvf-navy/10 text-icvf-navy">
                      <Brain className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-icvf-navy sm:text-base">
                        {quiz.title}
                      </p>
                      <p className="truncate text-xs text-icvf-text-light">
                        {quiz.courseName}
                        {quiz.timeLimitMinutes ? ` · ${quiz.timeLimitMinutes} min` : ""}
                        {` · ${attemptsLabel(quiz)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {quiz.myBestScore !== null && quiz.myBestScore !== undefined ? (
                      <Badge className="bg-icvf-navy text-white">
                        Best {quiz.myBestScore}/{quiz.myBestMaxScore}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                        New
                      </Badge>
                    )}
                    {exhausted ? (
                      <Badge variant="outline" className="text-muted-foreground">Done</Badge>
                    ) : null}
                    <ChevronRight className="size-4 text-icvf-text-light group-hover:text-icvf-accent" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
