"use client";

import { useEffect, useState } from "react";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  buildDriveDownloadUrl,
  buildDriveFileUrl,
  buildDrivePreviewUrl,
} from "@/lib/pass-papers/drive-id";
import { cn } from "@/lib/utils";

const PREVIEW_LOAD_TIMEOUT_MS = 8_000;

export interface PassPaperPreviewItem {
  title: string;
  fileId: string;
  subtitle?: string;
}

interface PassPaperPreviewDialogProps {
  item: PassPaperPreviewItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PassPaperPreviewDialog({
  item,
  open,
  onOpenChange,
}: PassPaperPreviewDialogProps) {
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    if (!open || !item) return;

    setIframeLoading(true);
    setIframeError(false);

    const timeout = window.setTimeout(() => {
      setIframeLoading((loading) => {
        if (loading) setIframeError(true);
        return false;
      });
    }, PREVIEW_LOAD_TIMEOUT_MS);

    return () => window.clearTimeout(timeout);
  }, [open, item?.fileId]);

  if (!item) return null;

  const previewUrl = buildDrivePreviewUrl(item.fileId);
  const downloadUrl = buildDriveDownloadUrl(item.fileId);
  const driveUrl = buildDriveFileUrl(item.fileId);
  const showFallback = iframeError;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setIframeError(false);
          setIframeLoading(true);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="flex max-h-[90vh] w-[min(96vw,56rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="space-y-1 border-b border-border px-5 py-4 text-left">
          <DialogTitle className="pr-8 text-lg">{item.title}</DialogTitle>
          {item.subtitle ? (
            <DialogDescription>{item.subtitle}</DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="relative min-h-[50vh] flex-1 bg-muted/30">
          {!showFallback ? (
            <>
              {iframeLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-6 animate-spin" />
                  <p>Loading preview…</p>
                </div>
              ) : null}
              <iframe
                title={`Preview: ${item.title}`}
                src={previewUrl}
                className="absolute inset-0 size-full border-0"
                allow="autoplay"
                onLoad={() => {
                  setIframeLoading(false);
                  setIframeError(false);
                }}
                onError={() => {
                  setIframeLoading(false);
                  setIframeError(true);
                }}
              />
            </>
          ) : (
            <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-3 px-6 text-center text-sm text-muted-foreground">
              <p>Preview could not be loaded in the browser.</p>
              <p className="text-xs">Open the file on Google Drive, preview in a new tab, or download it instead.</p>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
              >
                <ExternalLink className="size-4" />
                Open preview in new tab
              </a>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-4">
          <a
            href={driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <ExternalLink className="size-4" />
            Open in Drive
          </a>
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
          >
            <Download className="size-4" />
            Download
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
