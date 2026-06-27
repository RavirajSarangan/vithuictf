"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ButtonLink } from "@/components/shared/button-link";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { MarketingAnnouncement } from "@/types";

type MarketingAnnouncementPopupProps = {
  announcement: MarketingAnnouncement | null;
  /** Admin preview: parent controls open state */
  preview?: boolean;
  previewOpen?: boolean;
  onPreviewOpenChange?: (open: boolean) => void;
};

function showTitle(announcement: MarketingAnnouncement): boolean {
  return announcement.contentType !== "image_only" && Boolean(announcement.title.trim());
}

function showBody(announcement: MarketingAnnouncement): boolean {
  return announcement.contentType !== "image_only" && Boolean(announcement.body.trim());
}

function showImage(announcement: MarketingAnnouncement): boolean {
  return (
    announcement.contentType === "image_only" ||
    announcement.contentType === "text_image" ||
    announcement.contentType === "text_image_link"
  ) && Boolean(announcement.imageUrl.trim());
}

function showCta(announcement: MarketingAnnouncement): boolean {
  return (
    announcement.contentType === "text_image_link" &&
    Boolean(announcement.ctaLabel.trim()) &&
    Boolean(announcement.ctaUrl.trim())
  );
}

function dialogSizeClass(style: MarketingAnnouncement["displayStyle"]): string {
  switch (style) {
    case "minimal":
      return "sm:max-w-md p-0 overflow-hidden";
    case "image_hero":
      return "sm:max-w-lg p-0 overflow-hidden";
    case "promo":
      return "sm:max-w-xl p-0 overflow-hidden border-0 ring-0";
    case "card":
    default:
      return "sm:max-w-lg p-0 overflow-hidden";
  }
}

function AnnouncementImage({
  announcement,
  className,
  priority = false,
}: {
  announcement: MarketingAnnouncement;
  className?: string;
  priority?: boolean;
}) {
  const image = (
    <Image
      src={announcement.imageUrl}
      alt={announcement.title || "Announcement"}
      width={800}
      height={500}
      className={cn("h-auto w-full object-cover", className)}
      priority={priority}
    />
  );

  if (announcement.contentType === "image_only" && announcement.ctaUrl.trim()) {
    return (
      <a href={announcement.ctaUrl} target="_blank" rel="noopener noreferrer" className="block">
        {image}
      </a>
    );
  }

  return image;
}

function isDownloadUrl(url: string, label: string): boolean {
  if (!url) return false;
  const path = url.split("?")[0].toLowerCase();
  const extensions = [".pdf", ".zip", ".docx", ".xlsx", ".doc", ".png", ".jpg", ".jpeg", ".csv"];
  return extensions.some(ext => path.endsWith(ext)) || label.toLowerCase().includes("download");
}

function AnnouncementBody({
  announcement,
  className,
}: {
  announcement: MarketingAnnouncement;
  className?: string;
}) {
  const style = announcement.displayStyle;
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (url: string, title: string) => {
    setDownloading(true);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      
      const ext = url.split("?")[0].split(".").pop() || "pdf";
      const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      link.download = `${safeTitle || "document"}.${ext}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Download started!");
    } catch (error) {
      console.error("Direct download failed, falling back to open in tab:", error);
      window.open(url, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        style === "minimal" && "p-5",
        style === "card" && "p-6",
        style === "image_hero" && "p-6 pt-5",
        style === "promo" && "p-6",
        className
      )}
    >
      {showTitle(announcement) && (
        <DialogTitle
          className={cn(
            "font-heading text-icvf-navy-dark",
            style === "minimal" && "text-lg",
            style === "promo" && "text-xl sm:text-2xl",
            (style === "card" || style === "image_hero") && "text-xl"
          )}
        >
          {announcement.title}
        </DialogTitle>
      )}
      {showBody(announcement) && (
        <DialogDescription
          className={cn(
            "whitespace-pre-wrap text-sm leading-relaxed text-icvf-text-dark/80",
            style === "promo" && "text-base"
          )}
        >
          {announcement.body}
        </DialogDescription>
      )}
      {showCta(announcement) && (
        <div
          className={cn(
            "pt-1",
            style === "promo" &&
              "-mx-6 -mb-6 mt-2 border-t border-icvf-gold/20 bg-gradient-to-r from-icvf-navy-dark to-[#0d2137] px-6 py-4"
          )}
        >
          {isDownloadUrl(announcement.ctaUrl, announcement.ctaLabel) ? (
            <Button
              type="button"
              disabled={downloading}
              onClick={() => void handleDownload(announcement.ctaUrl, announcement.title || "document")}
              className={cn(
                "gap-2 font-heading transition-all",
                style === "promo"
                  ? "w-full bg-icvf-gold text-icvf-navy-dark hover:bg-icvf-gold/90 sm:w-auto"
                  : "bg-icvf-accent text-white hover:bg-icvf-accent/90"
              )}
            >
              {downloading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              {downloading ? "Downloading..." : announcement.ctaLabel || "Download"}
            </Button>
          ) : (
            <ButtonLink
              href={announcement.ctaUrl}
              target={announcement.ctaUrl.startsWith("http") ? "_blank" : undefined}
              rel={announcement.ctaUrl.startsWith("http") ? "noopener noreferrer" : undefined}
              className={cn(
                style === "promo" &&
                  "w-full bg-icvf-gold text-icvf-navy-dark hover:bg-icvf-gold/90 sm:w-auto"
              )}
            >
              {announcement.ctaLabel}
            </ButtonLink>
          )}
        </div>
      )}
    </div>
  );
}

export function MarketingAnnouncementPopup({
  announcement,
  preview = false,
  previewOpen,
  onPreviewOpenChange,
}: MarketingAnnouncementPopupProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!announcement) return null;
  if (announcement.displayStyle === "banner") return null;

  const isOpen = preview ? (previewOpen ?? false) : !dismissed;
  const handleOpenChange = (next: boolean) => {
    if (preview) {
      onPreviewOpenChange?.(next);
      return;
    }
    if (!next) setDismissed(true);
  };

  const style = announcement.displayStyle;
  const hasImage = showImage(announcement);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "gap-0 rounded-2xl bg-white shadow-2xl ring-1 ring-icvf-navy-dark/10",
          dialogSizeClass(style)
        )}
        showCloseButton
      >
        {style === "image_hero" && hasImage ? (
          <>
            <AnnouncementImage announcement={announcement} className="max-h-56 sm:max-h-72" priority />
            <AnnouncementBody announcement={announcement} />
          </>
        ) : style === "promo" ? (
          <div className="overflow-hidden rounded-2xl">
            {hasImage && (
              <div className="relative">
                <AnnouncementImage announcement={announcement} className="max-h-48" priority />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-icvf-navy-dark/40 to-transparent" />
              </div>
            )}
            <AnnouncementBody announcement={announcement} />
          </div>
        ) : style === "minimal" ? (
          <DialogHeader className="gap-0 p-0 text-left">
            {hasImage && (
              <AnnouncementImage announcement={announcement} className="max-h-36 rounded-t-2xl" />
            )}
            <AnnouncementBody announcement={announcement} />
          </DialogHeader>
        ) : (
          <div className="overflow-hidden rounded-2xl">
            {hasImage && (
              <AnnouncementImage announcement={announcement} className="max-h-52" priority />
            )}
            <AnnouncementBody announcement={announcement} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
