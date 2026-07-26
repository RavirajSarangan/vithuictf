"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getExamPortal } from "@/lib/actions/exam-written-submissions";
import { getActionErrorMessage } from "@/lib/action-error";
import { StudentEmptyState } from "@/components/student/portal/student-portal-states";
import { ExamPart1Card } from "@/components/student/exams/exam-part1-card";
import { ExamPart2Card } from "@/components/student/exams/exam-part2-card";
import { toast } from "sonner";
import type { Exam, ExamWrittenSubmission } from "@/types";

export default function StudentExamPortalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [exam, setExam] = useState<Exam | null>(null);
  const [mySubmission, setMySubmission] = useState<ExamWrittenSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const portal = await getExamPortal(id);
      setExam(portal.exam);
      setMySubmission(portal.mySubmission);
    } catch (error) {
      setNotFound(true);
      toast.error(getActionErrorMessage(error, "Failed to load exam"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !exam) {
    return <StudentEmptyState message="Exam not found or not available." />;
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-6">
      <Link
        href="/exams"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All exams
      </Link>

      <div>
        <h1 className="text-xl font-bold text-icvf-navy sm:text-2xl">{exam.title}</h1>
        <p className="mt-1 text-sm text-icvf-text-light">
          {exam.courseName} · {exam.subject} · {exam.term}
        </p>
      </div>

      {exam.quizId ? <ExamPart1Card exam={exam} /> : null}
      {exam.writtenEnabled ? (
        <ExamPart2Card exam={exam} mySubmission={mySubmission} onSubmitted={() => void refresh()} />
      ) : null}
    </div>
  );
}
