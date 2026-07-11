"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import type { PassPaperExamType, PassPaperMedium } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const MEDIUM_OPTIONS: { value: PassPaperMedium; label: string }[] = [
  { value: "english", label: "English" },
  { value: "sinhala", label: "Sinhala" },
  { value: "tamil", label: "Tamil" },
];

const EXAM_OPTIONS: { value: PassPaperExamType; label: string }[] = [
  { value: "al", label: "A/L" },
  { value: "ol", label: "O/L" },
  { value: "scholarship", label: "Scholarship" },
  { value: "other", label: "Other" },
];

const ACCEPT = ".pdf,image/png,image/jpeg";

type PassPaperUploadFormProps = {
  folderId: string;
  publishOnAdd?: boolean;
  onUploaded?: () => void;
};

export function PassPaperUploadForm({ folderId, publishOnAdd = false, onUploaded }: PassPaperUploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [medium, setMedium] = useState<PassPaperMedium | "">("");
  const [examType, setExamType] = useState<PassPaperExamType>("al");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setFile(null);
    setTitle("");
    setYear("");
    setMedium("");
    setExamType("al");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Select a file to upload");
      return;
    }
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folderId", folderId);
      formData.append("title", title.trim());
      if (year.trim()) formData.append("year", year.trim());
      if (medium) formData.append("medium", medium);
      formData.append("examType", examType);
      formData.append("published", String(publishOnAdd));

      const response = await fetch("/api/admin/pass-papers/upload", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json().catch(() => null)) as
        | { ok: true }
        | { ok: false; error: string }
        | null;

      if (!response.ok || !result || !result.ok) {
        toast.error(result && "error" in result ? result.error : "Upload failed");
        return;
      }

      toast.success("Past paper uploaded to Drive");
      reset();
      onUploaded?.();
    } catch {
      toast.error("Upload failed. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 rounded-lg border border-dashed border-border p-4">
      <div>
        <h3 className="text-sm font-semibold">Upload a file to Drive</h3>
        <p className="text-xs text-muted-foreground">
          PDF, JPG, or PNG (max 25 MB). The file is uploaded to Google Drive and linked here automatically.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="upload-file">File</Label>
          <Input
            id="upload-file"
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="upload-title">Title</Label>
          <Input
            id="upload-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Paper title"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="upload-year">Year</Label>
          <Input
            id="upload-year"
            type="number"
            min={1900}
            max={2100}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="2024"
          />
        </div>
        <div className="space-y-2">
          <Label>Medium</Label>
          <Select
            value={medium || "none"}
            onValueChange={(value) => setMedium(value === "none" ? "" : (value as PassPaperMedium))}
          >
            <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {MEDIUM_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Exam type</Label>
          <Select
            value={examType}
            onValueChange={(value) => {
              if (!value) return;
              setExamType(value as PassPaperExamType);
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {EXAM_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Switch checked={publishOnAdd} disabled />
          <Label className="text-muted-foreground">
            {publishOnAdd ? "Will publish on upload" : "Saved as draft"}
          </Label>
        </div>
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Uploading…" : "Upload to Drive"}
      </Button>
    </form>
  );
}
