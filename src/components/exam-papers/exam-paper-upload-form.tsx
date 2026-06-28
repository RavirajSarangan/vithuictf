"use client";

import { useState } from "react";
import { uploadExamPaperBatch } from "@/lib/actions/exam-papers";
import type { PassPaperExamType, PassPaperMedium } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

type PaperRow = {
  id: string;
  file: File | null;
  studentName: string;
  studentIndex: string;
};

const MEDIUM_OPTIONS: { value: PassPaperMedium; label: string }[] = [
  { value: "sinhala", label: "Sinhala" },
  { value: "tamil", label: "Tamil" },
  { value: "english", label: "English" },
];

const EXAM_TYPE_OPTIONS: { value: PassPaperExamType; label: string }[] = [
  { value: "ol", label: "O/L" },
  { value: "al", label: "A/L" },
  { value: "scholarship", label: "Scholarship" },
  { value: "other", label: "Other" },
];

function newRow(): PaperRow {
  return {
    id: crypto.randomUUID(),
    file: null,
    studentName: "",
    studentIndex: "",
  };
}

type ExamPaperUploadFormProps = {
  centerName: string;
  staffName: string;
  place: string;
  onSuccess?: () => void;
};

export function ExamPaperUploadForm({
  centerName,
  staffName,
  place,
  onSuccess,
}: ExamPaperUploadFormProps) {
  const [rows, setRows] = useState<PaperRow[]>([newRow()]);
  const [examYear, setExamYear] = useState("");
  const [medium, setMedium] = useState<PassPaperMedium | "">("");
  const [examType, setExamType] = useState<PassPaperExamType>("other");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateRow = (id: string, patch: Partial<PaperRow>) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const handleBulkFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const next = Array.from(files).map((file) => ({
      ...newRow(),
      file,
      studentName: file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim(),
    }));
    setRows((current) => {
      const kept = current.filter((row) => row.file || row.studentName.trim());
      return kept.length > 0 ? [...kept, ...next] : next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = rows.filter((row) => row.file);
    if (validRows.length === 0) {
      toast.error("Add at least one exam paper file");
      return;
    }
    if (validRows.some((row) => !row.studentName.trim())) {
      toast.error("Enter a student name for each file");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("examYear", examYear);
      formData.set("medium", medium);
      formData.set("examType", examType);
      formData.set("notes", notes);
      formData.set(
        "papers",
        JSON.stringify(
          validRows.map((row) => ({
            studentName: row.studentName.trim(),
            studentIndex: row.studentIndex.trim(),
          }))
        )
      );
      for (const row of validRows) {
        formData.append("files", row.file!);
      }

      const result = await uploadExamPaperBatch(formData);
      toast.success(`Uploaded ${validRows.length} exam paper${validRows.length === 1 ? "" : "s"}`);
      setRows([newRow()]);
      setExamYear("");
      setMedium("");
      setExamType("other");
      setNotes("");
      onSuccess?.();
      return result;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Center</p>
          <p className="mt-1 font-medium text-icvf-navy">{centerName}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Staff</p>
          <p className="mt-1 font-medium text-icvf-navy">{staffName}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Place</p>
          <p className="mt-1 font-medium text-icvf-navy">{place || "—"}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="exam-year">Exam year</Label>
          <Input
            id="exam-year"
            inputMode="numeric"
            placeholder="e.g. 2025"
            value={examYear}
            onChange={(e) => setExamYear(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Medium</Label>
          <Select value={medium || "none"} onValueChange={(v) => setMedium(v === "none" ? "" : (v as PassPaperMedium))}>
            <SelectTrigger><SelectValue placeholder="Select medium" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Not specified</SelectItem>
              {MEDIUM_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Exam type</Label>
          <Select value={examType} onValueChange={(v) => setExamType(v as PassPaperExamType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {EXAM_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="exam-notes">Notes (optional)</Label>
        <Textarea
          id="exam-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Batch notes for the administrator"
          rows={2}
        />
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Label>Student exam papers</Label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setRows((current) => [...current, newRow()])}>
              <Plus className="mr-1 size-4" /> Add row
            </Button>
            <label className="inline-flex cursor-pointer items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-muted">
              <Upload className="mr-1 size-4" /> Bulk add files
              <input
                type="file"
                className="sr-only"
                multiple
                accept=".pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  handleBulkFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>

        <div className="space-y-3">
          {rows.map((row, index) => (
            <div key={row.id} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_1fr_1.2fr_auto]">
              <div className="space-y-2">
                <Label>Student name</Label>
                <Input
                  value={row.studentName}
                  onChange={(e) => updateRow(row.id, { studentName: e.target.value })}
                  placeholder={`Student ${index + 1}`}
                  required={!!row.file}
                />
              </div>
              <div className="space-y-2">
                <Label>Index / roll no.</Label>
                <Input
                  value={row.studentIndex}
                  onChange={(e) => updateRow(row.id, { studentIndex: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label>File (PDF or image)</Label>
                <Input
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  onChange={(e) => updateRow(row.id, { file: e.target.files?.[0] ?? null })}
                />
                {row.file && <p className="text-xs text-muted-foreground">{row.file.name}</p>}
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setRows((current) => (current.length === 1 ? [newRow()] : current.filter((item) => item.id !== row.id)))}
                  aria-label="Remove row"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? <><Loader2 className="mr-2 size-4 animate-spin" /> Uploading…</> : "Upload exam papers"}
      </Button>
    </form>
  );
}
