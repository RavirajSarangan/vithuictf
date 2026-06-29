"use client";

import { useState, useSyncExternalStore } from "react";
import { Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import {
  RiFacebookFill,
  RiInstagramFill,
  RiLinkedinFill,
  RiTwitterXFill,
  RiWhatsappFill,
} from "@remixicon/react";
import { TikTokIcon } from "@/components/social-tracking/platform-icons";
import { Send } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  buildBlogPlatformShareUrls,
  buildBlogPostUrl,
  buildBlogShareCaption,
  type BlogShareInput,
  type BlogSharePlatform,
} from "@/lib/blog/share";
import { cn } from "@/lib/utils";
import type { BlogPost } from "@/types";

type BlogPostShareProps = {
  post: Pick<BlogPost, "title" | "slug" | "excerpt" | "tags">;
  variant?: "light" | "dark";
  label?: string;
  className?: string;
};

const PLATFORM_LABELS: Record<BlogSharePlatform, string> = {
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  linkedin: "LinkedIn",
  x: "X",
  telegram: "Telegram",
  instagram: "Instagram",
  tiktok: "TikTok",
};

function PlatformIcon({ platform, className }: { platform: BlogSharePlatform; className?: string }) {
  switch (platform) {
    case "facebook":
      return <RiFacebookFill className={className} />;
    case "whatsapp":
      return <RiWhatsappFill className={className} />;
    case "linkedin":
      return <RiLinkedinFill className={className} />;
    case "x":
      return <RiTwitterXFill className={className} />;
    case "telegram":
      return <Send className={className} />;
    case "instagram":
      return <RiInstagramFill className={className} />;
    case "tiktok":
      return <TikTokIcon className={className} />;
  }
}

export function BlogPostShare({
  post,
  variant = "light",
  label = "Share",
  className,
}: BlogPostShareProps) {
  const [open, setOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);

  const canNativeShare = useSyncExternalStore(
    () => () => {},
    () => typeof navigator !== "undefined" && "share" in navigator,
    () => false
  );

  const shareInput: BlogShareInput = {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    tags: post.tags,
  };
  const caption = buildBlogShareCaption(shareInput);
  const shareUrl = buildBlogPostUrl(post.slug);
  const platformUrls = buildBlogPlatformShareUrls(shareInput);

  const handleCopy = async (text: string, type: "link" | "caption", platform?: BlogSharePlatform) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "link") {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
        toast.success("Link copied to clipboard");
      } else {
        setCopiedCaption(true);
        setTimeout(() => setCopiedCaption(false), 2000);
        if (platform === "instagram" || platform === "tiktok") {
          toast.success(`Caption copied — paste in ${PLATFORM_LABELS[platform]}`);
        } else {
          toast.success("Caption copied to clipboard");
        }
      }
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      toast.error("Sharing is not supported on this device");
      return;
    }
    try {
      await navigator.share({
        title: post.title,
        text: caption,
        url: shareUrl,
      });
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        toast.error("Failed to share");
      }
    }
  };

  const stopCardNavigation = (event: React.MouseEvent | React.PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const isDark = variant === "dark";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        onClick={stopCardNavigation}
        onPointerDown={stopCardNavigation}
        className={cn(
          buttonVariants({
            variant: isDark ? "outline" : "ghost",
            size: "sm",
          }),
          isDark &&
            "border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white",
          "shrink-0",
          className
        )}
      >
        <Share2 className="size-4" />
        {label}
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-4"
        align="end"
        side="top"
        onClick={stopCardNavigation}
        onPointerDown={stopCardNavigation}
      >
        <PopoverHeader className="gap-1">
          <PopoverTitle>Share this article</PopoverTitle>
          <PopoverDescription>Caption includes #ICTF #vithoo</PopoverDescription>
        </PopoverHeader>

        <p className="mt-2 line-clamp-4 whitespace-pre-wrap rounded-lg bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
          {caption}
        </p>

        <div className="mt-3 grid grid-cols-4 gap-2">
          {(["facebook", "whatsapp", "linkedin", "x", "telegram"] as const).map((platform) => (
            <a
              key={platform}
              href={platformUrls[platform]}
              target="_blank"
              rel="noopener noreferrer"
              title={PLATFORM_LABELS[platform]}
              className={cn(
                buttonVariants({ variant: "outline", size: "icon-sm" }),
                "size-10"
              )}
              onClick={() => setOpen(false)}
            >
              <PlatformIcon platform={platform} className="size-4" />
              <span className="sr-only">{PLATFORM_LABELS[platform]}</span>
            </a>
          ))}
          {(["instagram", "tiktok"] as const).map((platform) => (
            <Button
              key={platform}
              type="button"
              variant="outline"
              size="icon-sm"
              className="size-10"
              title={`Copy caption for ${PLATFORM_LABELS[platform]}`}
              onClick={() => void handleCopy(caption, "caption", platform)}
            >
              <PlatformIcon platform={platform} className="size-4" />
              <span className="sr-only">{PLATFORM_LABELS[platform]}</span>
            </Button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleCopy(shareUrl, "link")}
          >
            <Copy className="size-4" />
            {copiedLink ? "Copied" : "Copy link"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleCopy(caption, "caption")}
          >
            <Copy className="size-4" />
            {copiedCaption ? "Copied" : "Copy caption"}
          </Button>
          {canNativeShare ? (
            <Button type="button" variant="icvf" size="sm" onClick={() => void handleNativeShare()}>
              <Share2 className="size-4" />
              Share
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
