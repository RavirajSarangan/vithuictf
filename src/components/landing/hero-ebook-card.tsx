"use client";

import { useState } from "react";
import Image from "next/image";
import { Download, ExternalLink, FileWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useEbooks } from "@/hooks/use-data";
import { incrementEbookDownload } from "@/lib/actions/ebooks";
import {
  extractGoogleDriveFileId,
  toGoogleDriveDownloadUrl,
  toGoogleDrivePreviewUrl,
} from "@/lib/google-drive-share-link";

export function HeroEbookCard() {
  const ebooks = useEbooks();
  const ebook = ebooks[0];
  const [previewOpen, setPreviewOpen] = useState(false);
  const [coverLoaded, setCoverLoaded] = useState(false);

  if (!ebook || !ebook.coverImageUrl) return null;

  const handleDownload = () => {
    if (!ebook.driveLink) return;

    if (!extractGoogleDriveFileId(ebook.driveLink)) {
      // Not a recognized Drive file link (e.g. a folder link) — the direct-download
      // trick below only works when Google serves Content-Disposition: attachment,
      // which it doesn't for folder pages. Open in a new tab instead of letting the
      // browser navigate the current tab away to Drive.
      window.open(ebook.driveLink, "_blank", "noopener,noreferrer");
      void incrementEbookDownload(ebook.id);
      return;
    }

    const downloadUrl = toGoogleDriveDownloadUrl(ebook.driveLink);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = ebook.title;
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
    void incrementEbookDownload(ebook.id);
  };

  return (
    <>
      <div className="hero-ebook-card">
        <button
          type="button"
          onClick={handleDownload}
          disabled={!ebook.driveLink}
          aria-label={`${ebook.badgeLabel} ${ebook.title}`}
          className="hero-ebook-badge-pulse relative z-2 -mb-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.6rem] font-bold tracking-wide text-icvf-navy-dark uppercase shadow-md transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ backgroundColor: ebook.accentColor, ["--ebook-accent" as string]: ebook.accentColor }}
        >
          <Download className="size-3" aria-hidden />
          {ebook.badgeLabel}
        </button>

        <div className="relative z-1 flex w-full flex-col items-center gap-1.5 overflow-hidden rounded-2xl border border-icvf-accent/20 bg-gradient-to-b from-icvf-navy via-icvf-navy-dark to-[#0a1628] p-2 shadow-xl">
          <button
            type="button"
            onClick={() => ebook.previewUrl && setPreviewOpen(true)}
            disabled={!ebook.previewUrl}
            aria-label={`Preview ${ebook.title}`}
            className="relative block aspect-3/4 w-full cursor-pointer overflow-hidden rounded-lg bg-white/5 disabled:cursor-default"
          >
            {!coverLoaded ? <Skeleton className="absolute inset-0 rounded-lg" /> : null}
            <Image
              src={ebook.coverImageUrl}
              alt={ebook.title}
              fill
              sizes="112px"
              className="object-cover"
              onLoad={() => setCoverLoaded(true)}
            />
          </button>

          <p className="text-center text-[0.55rem] font-bold tracking-[0.14em] text-white/85 uppercase">
            {ebook.footerLabel}
          </p>
        </div>
      </div>

      {ebook.previewUrl ? (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-2xl gap-3 p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>{ebook.title}</DialogTitle>
            </DialogHeader>
            <Button
              variant="icvf"
              size="lg"
              className="w-fit"
              onClick={handleDownload}
              disabled={!ebook.driveLink}
            >
              <Download className="size-4" aria-hidden />
              {ebook.badgeLabel} {ebook.footerLabel}
            </Button>
            {extractGoogleDriveFileId(ebook.previewUrl) ? (
              <div className="h-[75vh] max-h-168 w-full overflow-hidden rounded-xl border border-border bg-muted/30">
                <iframe
                  src={toGoogleDrivePreviewUrl(ebook.previewUrl)}
                  title={`${ebook.title} preview`}
                  className="h-full w-full"
                  allow="autoplay"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/30 p-8 text-center">
                <FileWarning className="size-8 text-muted-foreground" aria-hidden />
                <p className="text-sm text-muted-foreground">
                  This preview link isn&apos;t a Google Drive file link (it looks like a folder link),
                  so it can&apos;t be embedded here.
                </p>
                <a
                  href={ebook.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-icvf-accent hover:underline"
                >
                  Open in Google Drive
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
              </div>
            )}
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
