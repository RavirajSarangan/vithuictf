"use client";

import Link from "next/link";
import { GlassCard } from "@/components/shared/glass-card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Paperclip, Pin } from "lucide-react";
import type { PortalAnnouncement } from "@/types";

export function AnnouncementCard({
  announcement,
  href,
}: {
  announcement: PortalAnnouncement;
  href: string;
}) {
  return (
    <Link href={href} className="block">
      <GlassCard className="bg-white transition-colors hover:bg-muted/30">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {announcement.pinned ? (
                <Badge variant="secondary" className="gap-1">
                  <Pin className="size-3" />
                  Pinned
                </Badge>
              ) : null}
              <h3 className="font-semibold text-icvf-navy">{announcement.title}</h3>
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{announcement.body}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {announcement.authorName ?? "Staff"} ·{" "}
              {new Date(announcement.createdAt).toLocaleDateString("en-GB", {
                day: "numeric", month: "short", year: "numeric",
              })}
              {announcement.batchNames?.length ? ` · ${announcement.batchNames.join(", ")}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
            {announcement.attachmentPath ? <Paperclip className="size-3.5" /> : null}
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="size-3.5" />
              {announcement.replyCount ?? 0}
            </span>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
