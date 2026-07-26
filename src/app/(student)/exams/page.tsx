"use client";

import Link from "next/link";
import { FileCheck2, ChevronRight } from "lucide-react";
import { useStudentData } from "@/hooks/use-data";
import { useStudentExams } from "@/hooks/use-student-data";
import {
  StudentEmptyState,
  StudentPageHeader,
  StudentPageLoading,
} from "@/components/student/portal/student-portal-states";
import { Badge } from "@/components/ui/badge";
import type { Exam } from "@/types";

function partStatusBadges(exam: Exam) {
  const badges: { label: string; className: string }[] = [];

  if (exam.quizId) {
    if ((exam.myQuizAttemptCount ?? 0) > 0) {
      badges.push({ label: "Part 1 done", className: "border-emerald-200 bg-emerald-50 text-emerald-700" });
    } else {
      badges.push({ label: "Part 1 to do", className: "border-sky-200 bg-sky-50 text-sky-700" });
    }
  }

  if (exam.writtenEnabled) {
    const submission = exam.myWrittenSubmission;
    if (!submission) {
      badges.push({ label: "Part 2 to do", className: "border-sky-200 bg-sky-50 text-sky-700" });
    } else if (submission.status === "graded") {
      badges.push({ label: "Part 2 graded", className: "border-emerald-200 bg-emerald-50 text-emerald-700" });
    } else {
      badges.push({ label: "Part 2 submitted", className: "border-amber-200 bg-amber-50 text-amber-700" });
    }
  }

  return badges;
}

export default function StudentExamsPage() {
  const student = useStudentData();
  const { exams, loading } = useStudentExams(student?.id);

  if (student === undefined || loading) {
    return <StudentPageLoading rows={2} />;
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-6">
      <StudentPageHeader
        title="Exams"
        description="Your assigned exams — Part 1 MCQ and Part 2 written, in one place."
      />

      {exams.length === 0 ? (
        <StudentEmptyState message="No exams available yet — assigned exams appear here." />
      ) : (
        <ul className="flex flex-col gap-3">
          {exams.map((exam) => (
            <li key={exam.id}>
              <Link
                href={`/exams/${exam.id}`}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-icvf-border bg-white px-4 py-3.5 shadow-sm transition-colors hover:border-icvf-navy/20 hover:bg-icvf-surface sm:px-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-icvf-navy/10 text-icvf-navy">
                    <FileCheck2 className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-icvf-navy sm:text-base">
                      {exam.title}
                    </p>
                    <p className="truncate text-xs text-icvf-text-light">
                      {exam.courseName} · {exam.subject}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {partStatusBadges(exam).map((badge) => (
                    <Badge key={badge.label} variant="outline" className={badge.className}>
                      {badge.label}
                    </Badge>
                  ))}
                  <ChevronRight className="size-4 text-icvf-text-light group-hover:text-icvf-accent" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
