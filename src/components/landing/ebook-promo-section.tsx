"use client";

import { useState } from "react";
import { Download, ExternalLink, FileWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MarketingCtaBand, MarketingSection } from "@/components/landing/marketing-layout";
import { MotionStagger, MotionStaggerItem } from "@/components/shared/motion-section";
import { useEbooks } from "@/hooks/use-data";
import { incrementEbookDownload } from "@/lib/actions/ebooks";
import {
  extractGoogleDriveFileId,
  toGoogleDriveDownloadUrl,
  toGoogleDrivePreviewUrl,
} from "@/lib/google-drive-share-link";

export function EbookPromoSection() {
  const ebooks = useEbooks();
  const ebook = ebooks[0];
  const [previewOpen, setPreviewOpen] = useState(false);

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
    <MarketingSection id="ebook" tone="light">
      <MotionStagger stagger={0.12}>
        <MotionStaggerItem>
          <MarketingCtaBand className="text-left">
            <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
              <div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-icvf-navy-dark"
                  style={{ backgroundColor: ebook.accentColor }}
                >
                  <Download className="size-3.5" aria-hidden />
                  {ebook.badgeLabel}
                </span>
                <h3 className="mt-4 text-2xl font-bold text-white sm:text-3xl">{ebook.title}</h3>
                {ebook.subtitle ? (
                  <p className="mt-3 max-w-xl text-white/70">{ebook.subtitle}</p>
                ) : null}
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button variant="icvf" size="lg" onClick={handleDownload} disabled={!ebook.driveLink}>
                    <Download className="size-4" aria-hidden />
                    {ebook.badgeLabel} {ebook.footerLabel}
                  </Button>
                  {ebook.previewUrl ? (
                    <Button
                      variant="icvf-outline"
                      size="lg"
                      onClick={() => setPreviewOpen(true)}
                    >
                      Preview
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="mx-auto w-40 shrink-0 sm:w-48">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ebook.coverImageUrl}
                  alt={ebook.title}
                  className="w-full rounded-xl shadow-2xl ring-1 ring-white/10"
                />
              </div>
            </div>
          </MarketingCtaBand>
        </MotionStaggerItem>
      </MotionStagger>

      {ebook.previewUrl ? (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-3xl gap-3 p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>{ebook.title}</DialogTitle>
            </DialogHeader>
            {extractGoogleDriveFileId(ebook.previewUrl) ? (
              <div className="aspect-4/5 w-full overflow-hidden rounded-xl border border-border bg-muted/30 sm:aspect-video">
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
    </MarketingSection>
  );
}
