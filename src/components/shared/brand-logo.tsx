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
  nav: 40,
  footer: 56,
  authLogin: 50,
  authLoginAside: 48,
} as const;

export type BrandLogoSize = keyof typeof DISPLAY_HEIGHT_PX;

/** Square ICTF.svg mark (icon-only surfaces). */
const MARK_LAYOUT_PX: Partial<
  Record<BrandLogoSize, { width: number; height: number }>
> = {};

/** PNG wordmark layout boxes (dark PNG, often inverted on navy). */
const PNG_LAYOUT_PX: Partial<
  Record<BrandLogoSize, { width: number; height: number }>
> = {
  nav: { width: 154, height: 40 },
  footer: { width: 200, height: 56 },
};

/** Light SVG wordmark on dark surfaces (nav, footer, portal sidebar). */
const LIGHT_WORDMARK_LAYOUT_PX: Partial<
  Record<BrandLogoSize, { width: number; height: number }>
> = {
  nav: { width: 154, height: 40 },
  footer: { width: 200, height: 56 },
};

/** Dark PNG wordmark crop boxes (light-background auth pages). */
const WORDMARK_LAYOUT_PX: Partial<
  Record<BrandLogoSize, { width: number; height: number }>
> = {
  authLogin: { width: 142, height: 50 },
  authLoginAside: { width: 150, height: 48 },
};

interface BrandLogoProps {
  size?: BrandLogoSize;
  className?: string;
  alt?: string;
  priority?: boolean;
  /** Use square ICTF.svg mark (nav, footer, dark surfaces). */
  mark?: boolean;
  light?: boolean;
  fill?: boolean;
}

function isSvgSrc(src: string): boolean {
  return src.endsWith(".svg");
}

function layoutWidth(height: number): number {
  const aspect = BRAND.logoWidth / BRAND.logoHeight;
  return Math.round(height * aspect);
}

export function BrandLogo({
  size = "md",
  className,
  alt = BRAND.name,
  priority,
  mark,
  light,
  fill,
}: BrandLogoProps) {
  const src = mark ? BRAND.logoMark : light ? BRAND.logoLight : BRAND.logo;
  const isSvg = isSvgSrc(src);
  const markLayout = mark ? MARK_LAYOUT_PX[size] : undefined;
  const pngLayout = !mark && !light ? PNG_LAYOUT_PX[size] : undefined;
  const lightWordmarkLayout = light && !mark ? LIGHT_WORDMARK_LAYOUT_PX[size] : undefined;
  const wordmarkLayout = !mark && !light ? WORDMARK_LAYOUT_PX[size] : undefined;
  const layout = markLayout ?? pngLayout ?? lightWordmarkLayout ?? wordmarkLayout;
  const height = layout?.height ?? DISPLAY_HEIGHT_PX[size];
  const width = layout?.width ?? (mark ? height : layoutWidth(height));
  const isPngLayout = Boolean(pngLayout);

  const imageClassName = cn(
    "brand-logo-img block h-full w-full max-w-none shrink-0 leading-none",
    mark || isSvg || isPngLayout
      ? "object-contain object-left"
      : "object-cover object-center object-left",
    className
  );

  const imageStyle: CSSProperties = { width: "100%", height: "100%", maxWidth: "none" };

  if (fill) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        decoding="async"
        fetchPriority={priority ? "high" : undefined}
        className={cn(imageClassName, "absolute inset-0")}
        style={imageStyle}
      />
    );
  }

  return (
    <span
      data-brand-logo
      className="inline-block shrink-0 overflow-hidden leading-none"
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
