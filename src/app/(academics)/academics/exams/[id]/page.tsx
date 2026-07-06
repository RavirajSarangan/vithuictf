"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { GlassCard } from "@/components/shared/glass-card";
import {
  deleteExam,
  getMarkSheet,
  publishExamResults,
  saveMarks,
  unpublishExamResults,
  type MarkSheetRow,
} from "@/lib/actions/exams";
import { getActionErrorMessage } from "@/lib/action-error";
import { gradeForMarks } from "@/lib/grades";
import { examStatusLabel, examStatusVariant } from "@/components/exams/exam-status";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { ArrowLeft, CheckCircle2, Inbox, Loader2, Save, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import type { Exam } from "@/types";

export default function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [exam, setExam] = useState<Exam | null>(null);
  const [rows, setRows] = useState<MarkSheetRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const refresh = useCallback(async () => {
    try {
      const sheet = await getMarkSheet(id);
      setExam(sheet.exam);
      setRows(sheet.rows);
      setDrafts(
        Object.fromEntries(sheet.rows.map((row) => [row.studentId, row.marks?.toString() ?? ""]))
      );
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to load exam"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const dirty = rows.some((row) => (drafts[row.studentId] ?? "") !== (row.marks?.toString() ?? ""));
  const enteredCount = rows.filter((row) => (drafts[row.studentId] ?? "").trim() !== "").length;

  async function handleSave() {
    if (!exam) return;
    const entries: { studentId: string; marks: number | null }[] = [];
    for (const row of rows) {
      const draft = (drafts[row.studentId] ?? "").trim();
      const original = row.marks?.toString() ?? "";
      if (draft === original) continue;
      if (draft === "") {
        entries.push({ studentId: row.studentId, marks: null });
        continue;
      }
      const parsed = Number(draft);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > exam.totalMarks) {
        toast.error(`${row.studentName}: marks must be between 0 and ${exam.totalMarks}`);
        return;
      }
      entries.push({ studentId: row.studentId, marks: parsed });
    }
    if (!entries.length) return;

    setSaving(true);
    const result = await saveMarks(id, entries);
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Marks saved");
    void refresh();
  }

  async function handlePublish() {
    setPublishing(true);
    const result = await publishExamResults(id);
    setPublishing(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Results published — students notified");
    void refresh();
  }

  async function handleUnpublish() {
    setPublishing(true);
    const result = await unpublishExamResults(id);
    setPublishing(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Results unpublished");
    void refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteExam(id);
    setDeleting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Exam deleted");
    router.push("/academics/exams");
  }

  if (loading) {
    return (
      <GlassCard className="flex items-center justify-center bg-white py-16">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </GlassCard>
    );
  }

  if (!exam) {
    return <EmptyState icon={Inbox} title="Exam not found" />;
  }

  const dateLabel = new Date(exam.date).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/academics/exams"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All exams
      </Link>

      <PageHeader
        title={exam.title}
        description={`${exam.courseName ?? ""}${exam.batchName ? ` · ${exam.batchName}` : ""} · ${exam.subject} · ${exam.term} · ${dateLabel} · ${exam.totalMarks} marks`}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={examStatusVariant(exam.status)}>{examStatusLabel(exam.status)}</Badge>
            {exam.status !== "published" ? (
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button disabled={publishing || dirty}>
                      {publishing ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                      Publish results
                    </Button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Publish results?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Marks for {enteredCount} of {rows.length} students become visible to them
                      immediately and each student is notified.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => void handlePublish()}>Publish</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : isAdmin ? (
              <Button variant="outline" disabled={publishing} onClick={() => void handleUnpublish()}>
                {publishing ? <Loader2 className="size-4 animate-spin" /> : <Undo2 className="size-4" />}
                Unpublish
              </Button>
            ) : null}
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="destructive" disabled={deleting}>
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete exam?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes the exam and all entered marks permanently.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void handleDelete()}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      />

      <GlassCard className="bg-white p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Mark sheet</h3>
          <p className="text-xs text-muted-foreground">
            {enteredCount} of {rows.length} marks entered
          </p>
        </div>
        {rows.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            No active students in this batch.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Marks / {exam.totalMarks}</th>
                  <th className="px-4 py-3 font-medium">Grade</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const draft = (drafts[row.studentId] ?? "").trim();
                  const parsed = Number(draft);
                  const validDraft = draft !== "" && Number.isFinite(parsed) && parsed >= 0 && parsed <= exam.totalMarks;
                  return (
                    <tr key={row.studentId} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-icvf-navy">{row.studentName}</p>
                        <p className="text-xs text-muted-foreground">{row.enrollmentCode}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <Input
                          type="number"
                          min={0}
                          max={exam.totalMarks}
                          value={drafts[row.studentId] ?? ""}
                          onChange={(e) =>
                            setDrafts((prev) => ({ ...prev, [row.studentId]: e.target.value }))
                          }
                          className="h-8 w-24 text-sm"
                          aria-label={`Marks for ${row.studentName}`}
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        {validDraft ? (
                          <Badge variant="outline">{gradeForMarks(parsed, exam.totalMarks)}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {rows.length > 0 ? (
          <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t bg-white px-4 py-3">
            {dirty ? <p className="text-xs text-muted-foreground">Unsaved changes</p> : null}
            <Button onClick={() => void handleSave()} disabled={saving || !dirty}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save marks
            </Button>
          </div>
        ) : null}
      </GlassCard>
    </div>
  );
}
