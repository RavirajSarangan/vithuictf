import type { CSSProperties } from "react";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Rendered logo height in px (layout + visual). */
const DISPLAY_HEIGHT_PX = {
  xs: 20,
  sm: 28,
  md: 36,
  lg: 40,
  xl: 44,
  nav: 34,
  footer: 48,
  authLogin: 52,
  authLoginAside: 48,
} as const;

export type BrandLogoSize = keyof typeof DISPLAY_HEIGHT_PX;

interface BrandLogoProps {
  size?: BrandLogoSize;
  className?: string;
  alt?: string;
  priority?: boolean;
  light?: boolean;
  fill?: boolean;
}

function isWordmarkSrc(src: string): boolean {
  return src.endsWith(".svg");
}

function layoutWidth(height: number, wordmark: boolean): number {
  if (wordmark) {
    return Math.round(height * (BRAND.logoWidth / BRAND.logoHeight));
  }
  return height;
}

export function BrandLogo({
  size = "md",
  className,
  alt = BRAND.name,
  priority,
  light,
  fill,
}: BrandLogoProps) {
  const src = light ? BRAND.logoLight : BRAND.logo;
  const wordmark = isWordmarkSrc(src);
  const height = DISPLAY_HEIGHT_PX[size];
  const width = layoutWidth(height, wordmark);

  const imageClassName = cn(
    "brand-logo-img block h-full w-full max-w-none shrink-0 object-contain object-left leading-none",
    className
  );

  const imageStyle: CSSProperties = fill
    ? { maxWidth: "none" }
    : { maxWidth: "none" };

  if (fill) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        decoding="async"
        fetchPriority={priority ? "high" : undefined}
        className={cn(imageClassName, "absolute inset-0")}
        style={{ width: "100%", height: "100%", maxWidth: "none" }}
      />
    );
  }

  return (
    <span
      className="inline-block shrink-0 leading-none"
      style={{ width, height }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        decoding="async"
        fetchPriority={priority ? "high" : undefined}
        className={imageClassName}
        style={imageStyle}
      />
    </span>
  );
}
