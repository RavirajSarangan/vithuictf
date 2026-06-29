"use client";

import { useState } from "react";
import { cancelClassSession } from "@/lib/actions/academics";
import type { ClassSession } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SessionCancelDialogProps {
  session: ClassSession | null;
  batchName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancelled?: () => void;
}

export function SessionCancelDialog({
  session,
  batchName,
  open,
  onOpenChange,
  onCancelled,
}: SessionCancelDialogProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCancel = async () => {
    if (!session) return;
    if (!reason.trim()) {
      toast.error("Please enter a cancel message for students");
      return;
    }
    setSubmitting(true);
    try {
      await cancelClassSession(session.id, reason);
      toast.success("Class cancelled and students notified");
      setReason("");
      onOpenChange(false);
      onCancelled?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Cancel failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setReason("");
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel class</DialogTitle>
        </DialogHeader>
        {session ? (
          <div className="space-y-4">
            <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
              <p className="font-medium">{batchName ?? session.batchName ?? "Batch"}</p>
              <p className="text-muted-foreground">
                Class {session.sessionNumber} · {session.scheduledDate} · {session.startTime.slice(0, 5)}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Message to all enrolled students</Label>
              <Textarea
                id="cancel-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Class cancelled due to holiday. Next class as scheduled."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Keep class
              </Button>
              <Button type="button" variant="destructive" disabled={submitting} onClick={() => void handleCancel()}>
                {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Cancel class & notify
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
