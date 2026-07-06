"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { GlassCard } from "@/components/shared/glass-card";
import { AnnouncementCard } from "@/components/announcements/announcement-card";
import { BatchMultiSelect } from "@/components/announcements/batch-multi-select";
import { useBatches } from "@/hooks/use-academics";
import { createAnnouncement, getStaffAnnouncements } from "@/lib/actions/announcements";
import { getActionErrorMessage } from "@/lib/action-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Megaphone, Plus } from "lucide-react";
import { toast } from "sonner";
import type { PortalAnnouncement } from "@/types";

export default function AcademicsAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<PortalAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [batchIds, setBatchIds] = useState<string[]>([]);
  const [pinned, setPinned] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const { data: batches } = useBatches();

  const refresh = useCallback(async () => {
    try {
      setAnnouncements(await getStaffAnnouncements());
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to load announcements"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleCreate(formData: FormData) {
    if (!batchIds.length) {
      toast.error("Select at least one batch");
      return;
    }
    for (const id of batchIds) formData.append("batchIds", id);
    formData.set("pinned", pinned ? "true" : "false");
    setSubmitting(true);
    const result = await createAnnouncement(formData);
    setSubmitting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Announcement posted and students notified");
    formRef.current?.reset();
    setDialogOpen(false);
    setBatchIds([]);
    setPinned(false);
    void refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Announcements"
        description="Post updates to your batches and answer student questions."
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button>
                  <Plus className="size-4" />
                  New announcement
                </Button>
              }
            />
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>New announcement</DialogTitle>
                <DialogDescription>
                  Students in every selected batch are notified once — even if they are in
                  several of them.
                </DialogDescription>
              </DialogHeader>
              <form ref={formRef} action={handleCreate} className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label>Batches</Label>
                  <BatchMultiSelect batches={batches} selectedIds={batchIds} onChange={setBatchIds} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="announcement-title">Title</Label>
                  <Input id="announcement-title" name="title" placeholder="e.g. Class moved to Saturday" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="announcement-body">Message</Label>
                  <Textarea
                    id="announcement-body"
                    name="body"
                    placeholder="What do students need to know?"
                    rows={5}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="announcement-file">Attachment (optional, 20 MB max)</Label>
                  <Input id="announcement-file" name="file" type="file" />
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox checked={pinned} onCheckedChange={(v) => setPinned(v === true)} />
                  Pin to the top of the list
                </label>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                  Post announcement
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {loading ? (
        <GlassCard className="flex items-center justify-center bg-white py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </GlassCard>
      ) : announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements yet"
          description="Post the first announcement for one of your batches."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              href={`/academics/announcements/${announcement.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
