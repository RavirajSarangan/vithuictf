import Link from "next/link";
import { Brain, ChevronRight } from "lucide-react";
import { ProtectedPdfViewer } from "@/components/student/exams/protected-pdf-viewer";
import { Badge } from "@/components/ui/badge";
import type { Exam } from "@/types";

export function ExamPart1Card({ exam }: { exam: Exam }) {
  const attempted = (exam.myQuizAttemptCount ?? 0) > 0;

  return (
    <div className="rounded-2xl border border-icvf-border bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-icvf-navy/10 text-icvf-navy">
          <Brain className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-icvf-navy sm:text-base">Part 1 — MCQ</p>
          <p className="text-xs text-icvf-text-light">Auto-marked multiple choice questions.</p>
        </div>
      </div>

      {exam.mcqQuestionPaperPath ? (
        <div className="mt-4">
          <ProtectedPdfViewer signedUrlEndpoint={`/api/exams/${exam.id}/question-paper?part=mcq`} />
        </div>
      ) : null}

      <Link
        href={`/quizzes/${exam.quizId}`}
        className="group mt-4 flex items-center justify-between gap-3 rounded-xl border border-icvf-border bg-icvf-surface/60 px-4 py-3 transition-colors hover:border-icvf-navy/20 hover:bg-icvf-surface"
      >
        <span className="text-sm font-medium text-icvf-navy">
          {attempted ? "View my attempt" : "Start MCQ"}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          {attempted ? (
            <Badge className="bg-icvf-navy text-white">Attempted</Badge>
          ) : (
            <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
              Not started
            </Badge>
          )}
          <ChevronRight className="size-4 text-icvf-text-light group-hover:text-icvf-accent" />
        </div>
      </Link>
    </div>
  );
}
