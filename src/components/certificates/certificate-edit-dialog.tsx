"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCertificate } from "@/lib/actions/certificates";
import type { CertificateListItem } from "@/hooks/use-certificates";

interface CertificateEditDialogProps {
  certificate: CertificateListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function CertificateEditDialog({
  certificate,
  open,
  onOpenChange,
  onSaved,
}: CertificateEditDialogProps) {
  const [studentName, setStudentName] = useState("");
  const [courseName, setCourseName] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!certificate || !open) return;
    setStudentName(certificate.studentName);
    setCourseName(certificate.courseName);
    setIssueDate(certificate.issuedAt.slice(0, 10));
    setEmail(certificate.recipientEmail ?? "");
    setPhone(certificate.recipientPhone ?? "");
  }, [certificate, open]);

  const handleSave = async () => {
    if (!certificate) return;
    setSaving(true);
    try {
      const result = await updateCertificate(certificate.id, {
        studentName: studentName.trim(),
        courseName: courseName.trim(),
        issueDate,
        recipientEmail: email.trim() || undefined,
        recipientPhone: phone.trim() || undefined,
      });
      if (!result.ok) throw new Error(result.error);
      toast.success("Certificate updated and image regenerated");
      onOpenChange(false);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit certificate</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">
            ID: {certificate?.certificateNumber ?? certificate?.verifyCode ?? "—"}
          </p>
          <div className="space-y-2">
            <Label htmlFor="edit-student-name">Student name</Label>
            <Input id="edit-student-name" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-course-name">Course name</Label>
            <Input id="edit-course-name" value={courseName} onChange={(e) => setCourseName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-issue-date">Issue date</Label>
            <Input
              id="edit-issue-date"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-phone">Phone</Label>
            <Input id="edit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <Button type="button" disabled={saving} onClick={() => void handleSave()}>
            {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Save and regenerate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
