"use client";

import { useEffect, useMemo, useState } from "react";
import {
  countPaperCenterStaffRecipients,
  sendPaperCenterStaffMessage,
} from "@/lib/actions/paper-center-staff";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PaperCenterStaffMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paperCenterId?: string;
  paperCenterName?: string;
}

export function PaperCenterStaffMessageDialog({
  open,
  onOpenChange,
  paperCenterId,
  paperCenterName,
}: PaperCenterStaffMessageDialogProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const dialogTitle = paperCenterId
    ? `Message staff — ${paperCenterName ?? "Paper center"}`
    : "Message all paper center staff";

  const recipientLabel = paperCenterId
    ? `active staff at ${paperCenterName ?? "this center"}`
    : "active paper center staff";

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoadingCount(true);
    setRecipientCount(null);

    void countPaperCenterStaffRecipients(paperCenterId)
      .then((count) => {
        if (!cancelled) setRecipientCount(count);
      })
      .catch(() => {
        if (!cancelled) setRecipientCount(0);
      })
      .finally(() => {
        if (!cancelled) setLoadingCount(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, paperCenterId]);

  const canSend = useMemo(() => title.trim() && body.trim(), [title, body]);

  const handleSend = async () => {
    if (!canSend) return;
    setSubmitting(true);
    try {
      const summary = await sendPaperCenterStaffMessage({
        paperCenterId,
        title: title.trim(),
        body: body.trim(),
      });
      toast.success(
        `Sent — WhatsApp: ${summary.whatsappSent}, skipped: ${summary.whatsappSkipped}, failed: ${summary.whatsappFailed}`
      );
      setTitle("");
      setBody("");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {loadingCount ? (
              "Loading recipient count…"
            ) : recipientCount === null ? (
              `Send a WhatsApp message to ${recipientLabel}`
            ) : (
              <>
                {recipientCount} {recipientLabel}
              </>
            )}
          </p>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
            />
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Your manual message…"
              rows={5}
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              disabled={!canSend || submitting || loadingCount}
              onClick={() => void handleSend()}
            >
              {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Send WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
