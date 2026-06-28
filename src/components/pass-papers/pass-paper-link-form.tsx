"use client";

import { useEffect, useState } from "react";
import type { PassPaperExamType, PassPaperFolder, PassPaperItem, PassPaperMedium } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type PassPaperLinkFormValues = {
  title: string;
  driveUrl: string;
  year: string;
  medium: PassPaperMedium | "";
  examType: PassPaperExamType;
  published: boolean;
  folderId: string;
};

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

const emptyValues: PassPaperLinkFormValues = {
  title: "",
  driveUrl: "",
  year: "",
  medium: "",
  examType: "al",
  published: false,
  folderId: "",
};

function itemToValues(item: PassPaperItem): PassPaperLinkFormValues {
  return {
    title: item.title,
    driveUrl: item.driveUrl,
    year: item.year != null ? String(item.year) : "",
    medium: item.medium ?? "",
    examType: item.examType,
    published: item.published,
    folderId: item.folderId,
  };
}

type PassPaperLinkFormProps = {
  mode: "add" | "edit";
  item?: PassPaperItem | null;
  folders?: PassPaperFolder[];
  publishOnAdd?: boolean;
  onPublishOnAddChange?: (value: boolean) => void;
  onSubmit: (values: PassPaperLinkFormValues) => Promise<void>;
  onCancel?: () => void;
  submitting?: boolean;
};

export function PassPaperLinkForm({
  mode,
  item,
  folders = [],
  publishOnAdd = false,
  onPublishOnAddChange,
  onSubmit,
  onCancel,
  submitting,
}: PassPaperLinkFormProps) {
  const [values, setValues] = useState<PassPaperLinkFormValues>(
    item ? itemToValues(item) : { ...emptyValues, published: publishOnAdd }
  );

  useEffect(() => {
    setValues(item ? itemToValues(item) : { ...emptyValues, published: publishOnAdd });
  }, [item, publishOnAdd, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(values);
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="link-title">Title</Label>
          <Input
            id="link-title"
            value={values.title}
            onChange={(e) => setValues((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Paper title or folder name"
            required
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="link-url">Google Drive URL</Label>
          <Input
            id="link-url"
            value={values.driveUrl}
            onChange={(e) => setValues((prev) => ({ ...prev, driveUrl: e.target.value }))}
            placeholder="https://drive.google.com/..."
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="link-year">Year</Label>
          <Input
            id="link-year"
            type="number"
            min={1900}
            max={2100}
            value={values.year}
            onChange={(e) => setValues((prev) => ({ ...prev, year: e.target.value }))}
            placeholder="2024"
          />
        </div>
        <div className="space-y-2">
          <Label>Medium</Label>
          <Select
            value={values.medium || "none"}
            onValueChange={(value) =>
              setValues((prev) => ({
                ...prev,
                medium: value === "none" ? "" : (value as PassPaperMedium),
              }))
            }
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
            value={values.examType}
            onValueChange={(value) => {
              if (!value) return;
              setValues((prev) => ({ ...prev, examType: value as PassPaperExamType }));
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
        {mode === "edit" && folders.length > 0 ? (
          <div className="space-y-2 md:col-span-2">
            <Label>Folder</Label>
            <Select
              value={values.folderId}
              onValueChange={(value) => {
                if (!value) return;
                setValues((prev) => ({ ...prev, folderId: value }));
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="flex items-center gap-2 pt-6">
          <Switch
            checked={mode === "add" ? publishOnAdd : values.published}
            onCheckedChange={(checked) => {
              if (mode === "add" && onPublishOnAddChange) {
                onPublishOnAddChange(checked);
              } else {
                setValues((prev) => ({ ...prev, published: checked }));
              }
            }}
          />
          <Label>{mode === "add" ? "Publish when adding" : "Published"}</Label>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : mode === "add" ? "Add link" : "Save link"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}

type PassPaperLinkEditDialogProps = {
  item: PassPaperItem | null;
  folders?: PassPaperFolder[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: PassPaperLinkFormValues) => Promise<void>;
  submitting?: boolean;
};

export function PassPaperLinkEditDialog({
  item,
  folders = [],
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: PassPaperLinkEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit drive link</DialogTitle>
        </DialogHeader>
        {item ? (
          <PassPaperLinkForm
            mode="edit"
            item={item}
            folders={folders}
            onSubmit={async (values) => {
              await onSubmit(values);
              onOpenChange(false);
            }}
            onCancel={() => onOpenChange(false)}
            submitting={submitting}
          />
        ) : null}
        <DialogFooter className="hidden" />
      </DialogContent>
    </Dialog>
  );
}

type PassPaperBulkYearsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (startYear: number, endYear: number) => Promise<void>;
  submitting?: boolean;
};

export function PassPaperBulkYearsDialog({
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: PassPaperBulkYearsDialogProps) {
  const [startYear, setStartYear] = useState("2011");
  const [endYear, setEndYear] = useState("2025");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Bulk create year folders</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-year">Start year</Label>
            <Input
              id="start-year"
              type="number"
              min={1900}
              max={2100}
              value={startYear}
              onChange={(e) => setStartYear(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-year">End year</Label>
            <Input
              id="end-year"
              type="number"
              min={1900}
              max={2100}
              value={endYear}
              onChange={(e) => setEndYear(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={submitting}
            onClick={() =>
              void onSubmit(Number(startYear), Number(endYear)).then(() => onOpenChange(false))
            }
          >
            {submitting ? "Creating…" : "Create folders"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function parseLinkFormValues(values: PassPaperLinkFormValues, publishOnAdd: boolean) {
  const year = values.year.trim() ? Number(values.year) : undefined;
  return {
    title: values.title.trim(),
    driveUrl: values.driveUrl.trim(),
    year: year && !Number.isNaN(year) ? year : undefined,
    medium: values.medium || undefined,
    examType: values.examType,
    published: values.published || publishOnAdd,
  };
}
