"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEbooks } from "@/hooks/use-data";
import { incrementEbookDownload } from "@/lib/actions/ebooks";
import { toGoogleDriveDownloadUrl, toGoogleDrivePreviewUrl } from "@/lib/google-drive-share-link";

export function HeroEbookCard() {
  const ebooks = useEbooks();
  const ebook = ebooks[0];
  const [previewOpen, setPreviewOpen] = useState(false);

  if (!ebook || !ebook.coverImageUrl) return null;

  const handleDownload = () => {
    if (!ebook.driveLink) return;
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
      <div className="hero-ebook-card" style={{ ["--ebook-accent" as string]: ebook.accentColor }}>
        <button
          type="button"
          className="hero-ebook-badge"
          onClick={handleDownload}
          disabled={!ebook.driveLink}
          aria-label={`${ebook.badgeLabel} ${ebook.title}`}
        >
          <Download className="size-3" aria-hidden />
          {ebook.badgeLabel}
        </button>

        <div className="hero-ebook-panel">
          <button
            type="button"
            className="hero-ebook-cover-wrap"
            onClick={() => ebook.previewUrl && setPreviewOpen(true)}
            disabled={!ebook.previewUrl}
            aria-label={`Preview ${ebook.title}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ebook.coverImageUrl} alt={ebook.title} className="hero-ebook-cover" />
          </button>

          <p className="hero-ebook-footer">{ebook.footerLabel}</p>
        </div>
      </div>

      {ebook.previewUrl ? (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-3xl gap-3 p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>{ebook.title}</DialogTitle>
            </DialogHeader>
            <div className="aspect-4/5 w-full overflow-hidden rounded-xl border border-border bg-muted/30 sm:aspect-video">
              <iframe
                src={toGoogleDrivePreviewUrl(ebook.previewUrl)}
                title={`${ebook.title} preview`}
                className="h-full w-full"
                allow="autoplay"
              />
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
