"use client";

import { useState } from "react";
import { broadcastNotification, broadcastStudentMessage } from "@/lib/actions/admin";
import { GlassCard } from "@/components/shared/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sendPortalUsers, setSendPortalUsers] = useState(true);
  const [sendPortalStudents, setSendPortalStudents] = useState(true);
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const broadcastAllUsers = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and message are required");
      return;
    }
    setSubmitting(true);
    try {
      if (sendPortalUsers) {
        await broadcastNotification(title, body);
      }
      toast.success(sendPortalUsers ? "Notification broadcast to all portal users" : "Skipped portal broadcast");
      setTitle("");
      setBody("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Broadcast failed");
    } finally {
      setSubmitting(false);
    }
  };

  const broadcastStudents = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and message are required");
      return;
    }
    if (!sendPortalStudents && !sendWhatsApp) {
      toast.error("Select at least one channel");
      return;
    }
    setSubmitting(true);
    try {
      const summary = await broadcastStudentMessage({
        title: title.trim(),
        body: body.trim(),
        sendPortal: sendPortalStudents,
        sendWhatsApp,
      });
      toast.success(
        `Students notified — portal: ${summary.portalSent}, WhatsApp: ${summary.whatsappSent}, skipped: ${summary.whatsappSkipped}, failed: ${summary.whatsappFailed}`
      );
      setTitle("");
      setBody("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Broadcast failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Notifications" description="Broadcast announcements to students and portal users" />

      <GlassCard className="max-w-lg">
        <h3 className="mb-4 text-lg font-semibold text-icvf-navy">Message all students</h3>
        <div className="flex flex-col gap-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={sendPortalStudents} onCheckedChange={(v) => setSendPortalStudents(v === true)} />
            In-portal notification (students only)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={sendWhatsApp} onCheckedChange={(v) => setSendWhatsApp(v === true)} />
            WhatsApp message (students with valid phone)
          </label>
          <Button onClick={() => void broadcastStudents()} disabled={submitting}>
            Send to all students
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="max-w-lg">
        <h3 className="mb-4 text-lg font-semibold text-icvf-navy">All portal users</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Sends to every profile (students, staff, parents) via in-app notification only.
        </p>
        <label className="mb-4 flex items-center gap-2 text-sm">
          <Checkbox checked={sendPortalUsers} onCheckedChange={(v) => setSendPortalUsers(v === true)} />
          Send in-portal notification
        </label>
        <Button variant="outline" onClick={() => void broadcastAllUsers()} disabled={submitting || !sendPortalUsers}>
          Broadcast to all users
        </Button>
      </GlassCard>
    </div>
  );
}
