"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles, UserPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { issueManualCertificate, previewCertificateImage } from "@/lib/actions/certificates";

interface ManualIssueFormProps {
  onComplete: () => void;
}

export function ManualIssueForm({ onComplete }: ManualIssueFormProps) {
  const [studentName, setStudentName] = useState("");
  const [courseName, setCourseName] = useState("");
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [autoSendEmail, setAutoSendEmail] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canPreview = studentName.trim().length >= 2 && courseName.trim().length >= 2 && issueDate;

  const handlePreview = async () => {
    if (!canPreview) {
      toast.error("Enter student name, course name, and issue date");
      return;
    }
    setPreviewLoading(true);
    try {
      const result = await previewCertificateImage({
        studentName: studentName.trim(),
        courseName: courseName.trim(),
        issueDate,
      });
      if (!result.ok) throw new Error(result.error);
      setPreviewUrl(result.dataUrl);
      setPreviewKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleIssue = async () => {
    if (!canPreview) {
      toast.error("Enter student name, course name, and issue date");
      return;
    }
    setSubmitting(true);
    try {
      const result = await issueManualCertificate({
        studentName: studentName.trim(),
        courseName: courseName.trim(),
        issueDate,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        autoSendEmail,
      });
      if (!result.ok) throw new Error(result.error);
      toast.success(`Certificate ${result.certificateNumber} issued`);
      setStudentName("");
      setCourseName("");
      setEmail("");
      setPhone("");
      setPreviewUrl(null);
      onComplete();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to issue certificate");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPen className="size-5" />
          Manual certificate
        </CardTitle>
        <CardDescription>
          Enter name, course, and issue date to generate one certificate without a CSV file.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="manual-student-name">Student name</Label>
            <Input
              id="manual-student-name"
              value={studentName}
              onChange={(e) => {
                setStudentName(e.target.value);
                setPreviewUrl(null);
              }}
              placeholder="Full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manual-course-name">Course name</Label>
            <Input
              id="manual-course-name"
              value={courseName}
              onChange={(e) => {
                setCourseName(e.target.value);
                setPreviewUrl(null);
              }}
              placeholder="Program or course title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manual-issue-date">Issue date</Label>
            <Input
              id="manual-issue-date"
              type="date"
              value={issueDate}
              onChange={(e) => {
                setIssueDate(e.target.value);
                setPreviewUrl(null);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manual-email">Email (optional)</Label>
            <Input
              id="manual-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@email.com"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="manual-phone">Phone / WhatsApp (optional)</Label>
            <Input
              id="manual-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+94..."
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={autoSendEmail} onCheckedChange={(v) => setAutoSendEmail(v === true)} />
          Auto-send email when address is provided
        </label>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={!canPreview || previewLoading} onClick={() => void handlePreview()}>
            {previewLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
            Preview
          </Button>
          <Button type="button" disabled={!canPreview || submitting} onClick={() => void handleIssue()}>
            {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Generate certificate
          </Button>
        </div>

        {previewUrl ? (
          <div className="overflow-hidden rounded-lg border bg-muted/20 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={previewKey}
              src={previewUrl}
              alt="Certificate preview"
              className="mx-auto max-h-[420px] w-full object-contain"
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
