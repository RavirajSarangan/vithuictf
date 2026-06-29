"use client";

import { toCanvaEmbedUrl, toCanvaViewUrl } from "@/lib/canva/url";
import { cn } from "@/lib/utils";

interface CanvaSlideViewerProps {
  url: string;
  title: string;
  className?: string;
}

export function CanvaSlideViewer({ url, title, className }: CanvaSlideViewerProps) {
  const embedUrl = toCanvaEmbedUrl(url);
  if (!embedUrl) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-icvf-border bg-icvf-surface/60 px-4 text-center text-sm text-icvf-text-light">
        This slide link is invalid or no longer available.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-icvf-border bg-black/5 shadow-sm",
        className
      )}
    >
      <div className="relative aspect-video w-full">
        <iframe
          src={embedUrl}
          title={title}
          className="absolute inset-0 size-full border-0"
          allow="fullscreen"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </div>
  );
}

export function getCanvaExternalUrl(url: string): string | null {
  return toCanvaViewUrl(url);
}
