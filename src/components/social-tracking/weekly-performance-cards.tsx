"use client";

import type { WeeklyTrackingSummary } from "@/types";
import { SocialBrandIcon } from "@/components/social-tracking/social-brand-icon";
import { Upload } from "lucide-react";

interface WeeklyPerformanceCardsProps {
  summary: WeeklyTrackingSummary;
}

const cards = [
  { key: "total", label: "Total Uploads", slug: undefined as string | undefined, valueKey: "totalUploads" as const, useUploadIcon: true },
  { key: "yt-video", label: "Youtube Videos", slug: "youtube_video", valueKey: "youtubeVideos" as const },
  { key: "yt-shorts", label: "Youtube Shorts", slug: "youtube_shorts", valueKey: "youtubeShorts" as const },
  { key: "tiktok", label: "Tiktok Videos", slug: "tiktok_video", valueKey: "tiktokVideos" as const },
  { key: "reels", label: "Insta Reels", slug: "insta_reel", valueKey: "instaReels" as const },
] as const;

export function WeeklyPerformanceCards({ summary }: WeeklyPerformanceCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => {
        const { key, label, slug, valueKey } = card;
        const useUploadIcon = "useUploadIcon" in card && card.useUploadIcon;

        return (
        <div
          key={key}
          className="rounded-2xl border border-icvf-border bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-icvf-text-light">{label}</p>
              <p className="mt-2 text-3xl font-bold text-icvf-navy">{summary[valueKey]}</p>
            </div>
            <div className="rounded-xl bg-icvf-navy/10 p-3">
              {useUploadIcon ? (
                <Upload className="size-5 text-icvf-navy" />
              ) : (
                <SocialBrandIcon slug={slug} kind="content" size="lg" />
              )}
            </div>
          </div>
        </div>
        );
      })}
    </div>
  );
}
