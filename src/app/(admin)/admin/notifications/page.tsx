"use client";

import { useState } from "react";
import { broadcastNotification } from "@/lib/actions/admin";
import { GlassCard } from "@/components/shared/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const broadcast = async () => {
    try {
      await broadcastNotification(title, body);
      toast.success("Notification broadcast to all users");
      setTitle("");
      setBody("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Broadcast failed");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Notifications" description="Broadcast announcements to all portal users" />
      <GlassCard className="max-w-lg border-white/10 bg-white/5">
      <h3 className="mb-4 text-lg font-semibold text-white">Broadcast Notification</h3>
      <div className="flex flex-col gap-4">
        <div>
          <Label className="text-white/70">Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-white/20 bg-white/10 text-white"
          />
        </div>
        <div>
          <Label className="text-white/70">Message</Label>
          <Input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="border-white/20 bg-white/10 text-white"
          />
        </div>
        <Button onClick={broadcast} className="bg-icvf-accent hover:bg-icvf-accent-hover">
          Send to All Users
        </Button>
      </div>
      </GlassCard>
    </div>
  );
}
