"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { GlassCard } from "@/components/shared/glass-card";
import { BatchPicker } from "@/components/academics/batch-picker";
import { useAdminCourses } from "@/hooks/use-data";
import { useBatches } from "@/hooks/use-academics";
import { useAuth } from "@/providers/auth-provider";
import {
  getBatchReportCardOverview,
  publishReportCards,
  unpublishReportCards,
} from "@/lib/actions/report-cards";
import type { BatchReportCards } from "@/lib/report-cards/data";
import { getActionErrorMessage } from "@/lib/action-error";
import { EXAM_TERMS } from "@/components/exams/exam-status";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Award, CheckCircle2, Download, Loader2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import type { ReportCardPublication } from "@/types";

export default function ReportCardsPage() {
  const { user } = useAuth();
  const [courseId, setCourseId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [term, setTerm] = useState(EXAM_TERMS[0]);
  const [data, setData] = useState<BatchReportCards | null>(null);
  const [publication, setPublication] = useState<ReportCardPublication | null>(null);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const { data: courses } = useAdminCourses();
  const { data: batches } = useBatches();

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const selectedCourse = courses.find((c) => c.id === courseId);

  const refresh = useCallback(async () => {
    if (!batchId) {
      setData(null);
      setPublication(null);
      return;
    }
    setLoading(true);
    try {
      const overview = await getBatchReportCardOverview(batchId, term);
      setData(overview.data);
      setPublication(overview.publication);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to load report cards"));
    } finally {
      setLoading(false);
    }
  }, [batchId, term]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handlePublish() {
    setPublishing(true);
    const result = await publishReportCards(batchId, term);
    setPublishing(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Report cards published — students notified");
    void refresh();
  }

  async function handleUnpublish() {
    setPublishing(true);
    const result = await unpublishReportCards(batchId, term);
    setPublishing(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Report cards unpublished");
    void refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Report cards"
        description="Preview term report cards per batch, download PDFs, and publish them to students."
      />

      <GlassCard className="bg-white">
        <div className="grid gap-4 sm:grid-cols-3">
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
          <div className="grid gap-2">
            <Label>Batch</Label>
            {selectedCourse ? (
              <BatchPicker
                courseId={selectedCourse.id}
                courseName={selectedCourse.name}
                batches={batches}
                value={batchId}
                onChange={setBatchId}
              />
            ) : (
              <p className="flex h-9 items-center text-sm text-muted-foreground">Select a course first</p>
            )}
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
      </GlassCard>

      {!batchId ? (
        <EmptyState
          icon={Award}
          title="Pick a batch"
          description="Choose a course, batch, and term to preview report cards."
        />
      ) : loading ? (
        <GlassCard className="flex items-center justify-center bg-white py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </GlassCard>
      ) : !data || data.exams.length === 0 ? (
        <EmptyState
          icon={Award}
          title={`No published exams for ${term}`}
          description="Report cards are built from published exam results. Publish exam marks first."
        />
      ) : (
        <GlassCard className="bg-white p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold">
                {data.batchName} · {data.term}
              </h3>
              <p className="text-xs text-muted-foreground">
                {data.exams.length} published exam{data.exams.length === 1 ? "" : "s"} ·{" "}
                {data.students.length} students
              </p>
            </div>
            <div className="flex items-center gap-2">
              {publication ? (
                <>
                  <Badge>
                    Published{" "}
                    {new Date(publication.publishedAt).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short",
                    })}
                  </Badge>
                  {isAdmin ? (
                    <Button variant="outline" size="sm" disabled={publishing} onClick={() => void handleUnpublish()}>
                      {publishing ? <Loader2 className="size-4 animate-spin" /> : <Undo2 className="size-4" />}
                      Unpublish
                    </Button>
                  ) : null}
                </>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button size="sm" disabled={publishing}>
                        {publishing ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                        Publish to students
                      </Button>
                    }
                  />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Publish report cards?</AlertDialogTitle>
                      <AlertDialogDescription>
                        All {data.students.length} students in {data.batchName} can then download
                        their {data.term} report card, and each student is notified.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => void handlePublish()}>Publish</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 text-right font-medium">Average</th>
                  <th className="px-4 py-3 text-right font-medium">Grade</th>
                  <th className="px-4 py-3 text-right font-medium">Rank</th>
                  <th className="px-4 py-3 text-right font-medium">Attendance</th>
                  <th className="px-4 py-3 text-right font-medium">PDF</th>
                </tr>
              </thead>
              <tbody>
                {data.students.map((student) => (
                  <tr key={student.studentId} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-icvf-navy">{student.studentName}</p>
                      <p className="text-xs text-muted-foreground">{student.enrollmentCode}</p>
                    </td>
                    <td className="px-4 py-2.5 text-right">{student.averagePercent}%</td>
                    <td className="px-4 py-2.5 text-right">
                      <Badge variant="outline">{student.overallGrade}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right">#{student.rank}</td>
                    <td className="px-4 py-2.5 text-right">{student.attendancePercent}%</td>
                    <td className="px-4 py-2.5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        onClick={() =>
                          window.open(
                            `/api/report-card?studentId=${student.studentId}&batchId=${batchId}&term=${encodeURIComponent(term)}`,
                            "_blank",
                            "noopener"
                          )
                        }
                      >
                        <Download className="size-3.5" />
                      </Button>
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
