"use client";

import { useState, useSyncExternalStore } from "react";
import { Copy, MessageCircle, Share2 } from "lucide-react";
import { RiLinkedinFill, RiTwitterXFill } from "@remixicon/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ShareCardButtonsProps {
  shareUrl: string;
  title: string;
  description?: string;
}

export function ShareCardButtons({ shareUrl, title, description }: ShareCardButtonsProps) {
  const [copied, setCopied] = useState(false);
  const canNativeShare = useSyncExternalStore(
    () => () => {},
    () => typeof navigator !== "undefined" && "share" in navigator,
    () => false
  );
  const shareText = description ? `${title} — ${description}` : title;

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  const whatsAppUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      toast.error("Sharing is not supported on this device");
      return;
    }
    try {
      await navigator.share({ title, text: shareText, url: shareUrl });
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        toast.error("Failed to share");
      }
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="break-all rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">{shareUrl}</p>
      <div className="flex flex-wrap gap-2">
        <a
          href={linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <RiLinkedinFill className="mr-1.5 size-4" />
          LinkedIn
        </a>
        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <MessageCircle className="mr-1.5 size-4" />
          WhatsApp
        </a>
        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <RiTwitterXFill className="mr-1.5 size-4" />
          X
        </a>
        <Button variant="outline" size="sm" onClick={() => void handleCopy()}>
          <Copy className="mr-1.5 size-4" />
          {copied ? "Copied" : "Copy link"}
        </Button>
        {canNativeShare && (
          <Button variant="icvf" size="sm" onClick={() => void handleNativeShare()}>
            <Share2 className="mr-1.5 size-4" />
            Share
          </Button>
        )}
      </div>
    </div>
  );
}
