"use client";

import { useMemo, useState } from "react";
import { sendBatchMessage } from "@/lib/actions/academics";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

interface BatchMessageDialogProps {
  batchId: string;
  batchName: string;
  recipientCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BatchMessageDialog({
  batchId,
  batchName,
  recipientCount,
  open,
  onOpenChange,
}: BatchMessageDialogProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sendPortal, setSendPortal] = useState(true);
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const canSend = useMemo(
    () => title.trim() && body.trim() && (sendPortal || sendWhatsApp),
    [title, body, sendPortal, sendWhatsApp]
  );

  const handleSend = async () => {
    if (!canSend) return;
    setSubmitting(true);
    try {
      const summary = await sendBatchMessage(batchId, {
        title: title.trim(),
        body: body.trim(),
        sendPortal,
        sendWhatsApp,
      });
      toast.success(
        `Sent — portal: ${summary.portalSent}, WhatsApp: ${summary.whatsappSent}, skipped: ${summary.whatsappSkipped}, failed: ${summary.whatsappFailed}`
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
          <DialogTitle>Message all students — {batchName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{recipientCount} active enrolled students</p>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" />
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Your manual message..."
              rows={5}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={sendPortal} onCheckedChange={(v) => setSendPortal(v === true)} />
              Send in-portal notification
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={sendWhatsApp} onCheckedChange={(v) => setSendWhatsApp(v === true)} />
              Send WhatsApp message
            </label>
          </div>
          <div className="flex justify-end">
            <Button type="button" disabled={!canSend || submitting} onClick={() => void handleSend()}>
              {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Send message
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
