import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import {
  getContentTypeMeta,
  getPlatformMeta,
  type SocialBrandIcon,
} from "@/lib/social-platform-meta";

interface SocialBrandIconProps {
  slug: string | undefined;
  kind?: "platform" | "content";
  size?: "sm" | "md" | "lg";
  className?: string;
  showBackground?: boolean;
}

const sizeClasses = {
  sm: { box: "size-7", icon: "size-3.5" },
  md: { box: "size-8", icon: "size-4" },
  lg: { box: "size-10", icon: "size-5" },
} as const;

function BrandIconGlyph({
  icon: Icon,
  color,
  size,
}: {
  icon: SocialBrandIcon;
  color: string;
  size: keyof typeof sizeClasses;
}) {
  return (
    <span style={{ color } as CSSProperties} className="inline-flex">
      <Icon className={sizeClasses[size].icon} />
    </span>
  );
}

export function SocialBrandIcon({
  slug,
  kind = "platform",
  size = "md",
  className,
  showBackground = true,
}: SocialBrandIconProps) {
  const meta =
    kind === "platform" ? getPlatformMeta(slug) : getContentTypeMeta(slug);

  if (!meta) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-lg bg-icvf-surface text-xs font-semibold text-icvf-text-light",
          sizeClasses[size].box,
          className
        )}
        aria-hidden
      >
        ?
      </span>
    );
  }

  if (!showBackground) {
    return (
      <BrandIconGlyph icon={meta.icon} color={meta.color} size={size} />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg",
        sizeClasses[size].box,
        className
      )}
      style={{ backgroundColor: `${meta.color}18` }}
      aria-hidden
    >
      <BrandIconGlyph icon={meta.icon} color={meta.color} size={size} />
    </span>
  );
}
