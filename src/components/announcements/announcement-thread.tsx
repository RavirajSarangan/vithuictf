"use client";

import { useCallback, useEffect, useState } from "react";
import { GlassCard } from "@/components/shared/glass-card";
import { EmptyState } from "@/components/shared/empty-state";
import {
  addAnnouncementReply,
  deleteAnnouncementReply,
  getAnnouncementAttachmentUrl,
  getAnnouncementThread,
} from "@/lib/actions/announcements";
import { getActionErrorMessage } from "@/lib/action-error";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Inbox, Loader2, Paperclip, Pin, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { AnnouncementReply, PortalAnnouncement, UserRole } from "@/types";

const STAFF_ROLES: UserRole[] = ["teacher", "admin", "super_admin"];

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export function AnnouncementThread({ announcementId }: { announcementId: string }) {
  const { user } = useAuth();
  const [announcement, setAnnouncement] = useState<PortalAnnouncement | null>(null);
  const [replies, setReplies] = useState<AnnouncementReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const isStaff = user ? STAFF_ROLES.includes(user.role) : false;
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const refresh = useCallback(async () => {
    try {
      const thread = await getAnnouncementThread(announcementId);
      setAnnouncement(thread.announcement);
      setReplies(thread.replies);
    } catch (error) {
      toast.error(getActionErrorMessage(error, "Failed to load announcement"));
    } finally {
      setLoading(false);
    }
  }, [announcementId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleReply() {
    setSending(true);
    const result = await addAnnouncementReply(announcementId, reply);
    setSending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setReply("");
    void refresh();
  }

  async function handleDeleteReply(replyId: string) {
    const result = await deleteAnnouncementReply(replyId);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Reply removed");
    void refresh();
  }

  async function handleOpenAttachment() {
    const result = await getAnnouncementAttachmentUrl(announcementId);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    window.open(result.data.url, "_blank", "noopener");
  }

  if (loading) {
    return (
      <GlassCard className="flex items-center justify-center bg-white py-16">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </GlassCard>
    );
  }

  if (!announcement) {
    return <EmptyState icon={Inbox} title="Announcement not found" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <GlassCard className="bg-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {announcement.pinned ? (
                <Badge variant="secondary" className="gap-1">
                  <Pin className="size-3" />
                  Pinned
                </Badge>
              ) : null}
              <h2 className="text-lg font-semibold text-icvf-navy">{announcement.title}</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {announcement.authorName ?? "Staff"} · {formatDateTime(announcement.createdAt)}
              {announcement.batchNames?.length ? ` · ${announcement.batchNames.join(", ")}` : ""}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm whitespace-pre-wrap">{announcement.body}</p>
        {announcement.attachmentPath ? (
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => void handleOpenAttachment()}
          >
            <Paperclip className="size-3.5" />
            {announcement.attachmentName ?? "Attachment"}
          </Button>
        ) : null}
      </GlassCard>

      <GlassCard className="bg-white p-0">
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-semibold">
            Replies{replies.length ? ` (${replies.length})` : ""}
          </h3>
        </div>
        {replies.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No replies yet. Ask a question or leave a comment below.
          </p>
        ) : (
          <ul className="divide-y">
            {replies.map((item) => {
              const own = item.authorId === user?.id;
              const authorIsStaff = item.authorRole ? STAFF_ROLES.includes(item.authorRole) : false;
              const canDelete = own || isAdmin || (isStaff && announcement.createdBy === user?.id);
              return (
                <li key={item.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {item.authorName ?? "User"}
                      </span>
                      {authorIsStaff ? (
                        <Badge variant="outline" className="ml-1.5 text-[10px]">
                          Staff
                        </Badge>
                      ) : null}
                      <span className="ml-1.5">{formatDateTime(item.createdAt)}</span>
                    </p>
                    <p className="mt-1 text-sm whitespace-pre-wrap">{item.body}</p>
                  </div>
                  {canDelete ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => void handleDeleteReply(item.id)}
                      aria-label="Delete reply"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        <div className="flex items-end gap-2 border-t px-4 py-3">
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a reply…"
            rows={2}
            className="text-sm"
          />
          <Button onClick={() => void handleReply()} disabled={sending || !reply.trim()}>
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Reply
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
