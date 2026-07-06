"use client";

import { use } from "react";
import Link from "next/link";
import { AnnouncementThread } from "@/components/announcements/announcement-thread";
import { ArrowLeft } from "lucide-react";

export default function StudentAnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <Link
        href="/announcements"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All announcements
      </Link>

      <AnnouncementThread announcementId={id} />
    </div>
  );
}
