"use client";

import dynamic from "next/dynamic";
import { useExams, useStudentData, useStudentResults } from "@/hooks/use-data";
import { useStudentReportCards } from "@/hooks/use-student-data";
import { GlassCard } from "@/components/shared/glass-card";
import {
  StudentEmptyState,
  StudentPageHeader,
  StudentPageLoading,
} from "@/components/student/portal/student-portal-states";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarClock, Download } from "lucide-react";
import { formatStudentRank, hasAssignedRank } from "@/lib/student-rank";

const ResultsCharts = dynamic(
  () =>
    import("@/components/student/results/results-charts").then((mod) => mod.ResultsCharts),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-2xl" />
        ))}
      </div>
    ),
  }
);

export default function ResultsPage() {
  const student = useStudentData();
  const { results, isLoading: resultsLoading } = useStudentResults(student?.id);
  const { exams } = useExams();
  const { reportCards } = useStudentReportCards(student?.id);

  if (student === undefined || resultsLoading) {
    return <StudentPageLoading rows={3} />;
  }

  const hasResults = results.length > 0;
  const today = new Date().toISOString().slice(0, 10);
  const upcomingExams = exams
    .filter((exam) => exam.date >= today && exam.status !== "published")
    .slice(0, 6);

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-6">
      <StudentPageHeader
        title="Results"
        description="Track grades, exam history, and performance trends for your program."
        action={
          student && hasAssignedRank(student.rank) ? (
            <Badge className="bg-icvf-navy text-white">Rank {formatStudentRank(student.rank)}</Badge>
          ) : null
        }
      />

      {upcomingExams.length > 0 ? (
        <GlassCard>
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-icvf-navy">
            <CalendarClock className="size-4" />
            Upcoming exams
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {upcomingExams.map((exam) => (
              <li key={exam.id} className="rounded-xl border bg-white/60 px-3 py-2.5 text-sm">
                <p className="font-medium text-icvf-navy">{exam.title}</p>
                <p className="text-xs text-muted-foreground">
                  {[exam.subject, exam.term, exam.batchName ?? exam.courseName]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="mt-1 text-xs font-medium">
                  {new Date(exam.date).toLocaleDateString("en-GB", {
                    weekday: "short", day: "numeric", month: "short",
                  })}
                  {exam.startTime ? ` · ${exam.startTime.slice(0, 5)}` : ""}
                  {" · "}{exam.totalMarks} marks
                </p>
              </li>
            ))}
          </ul>
        </GlassCard>
      ) : null}

      {reportCards.length > 0 && student ? (
        <GlassCard>
          <h3 className="mb-3 font-semibold text-icvf-navy">Report cards</h3>
          <div className="flex flex-wrap gap-2">
            {reportCards.map((rc) => (
              <Button
                key={rc.id}
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(
                    `/api/report-card?studentId=${student.id}&batchId=${rc.batchId}&term=${encodeURIComponent(rc.term)}`,
                    "_blank",
                    "noopener"
                  )
                }
              >
                <Download className="size-3.5" />
                {rc.batchName ? `${rc.batchName} — ${rc.term}` : rc.term}
              </Button>
            ))}
          </div>
        </GlassCard>
      ) : null}

      {!hasResults ? (
        <StudentEmptyState message="No exam results yet. Your grades and charts will appear here after your first published results." />
      ) : (
        <>
          <ResultsCharts results={results} />

          <GlassCard>
            <h3 className="mb-4 font-semibold text-icvf-navy">Exam history</h3>
            <div className="-mx-1 overflow-x-auto px-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Rank</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...results].reverse().map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="min-w-[8rem]">{r.examTitle}</TableCell>
                      <TableCell>{r.subject}</TableCell>
                      <TableCell>
                        {r.marks}/{r.maxMarks}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-icvf-accent text-white">{r.grade}</Badge>
                      </TableCell>
                      <TableCell>#{r.rank}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}
