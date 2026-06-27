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
  nav: 56,
  footer: 68,
  authLogin: 50,
  authLoginMobile: 55,
  authLoginAside: 48,
  authLoginDesktop: 56,
  mobileSheet: 52,
} as const;

export type BrandLogoSize = keyof typeof DISPLAY_HEIGHT_PX;

/** Square ICTF.svg mark (icon-only surfaces). */
const MARK_LAYOUT_PX: Partial<
  Record<BrandLogoSize, { width: number; height: number }>
> = {};

/** PNG wordmark layout boxes (dark PNG, often inverted on navy). */
const PNG_LAYOUT_PX: Partial<
  Record<BrandLogoSize, { width: number; height: number }>
> = {};

/** Sizes driven by platform_settings.brand_logo_settings via CSS variables on :root. */
const DB_DRIVEN_SIZES = new Set<BrandLogoSize>(["nav", "footer"]);

/** Dark PNG wordmark crop boxes (light-background auth pages). */
const WORDMARK_LAYOUT_PX: Partial<
  Record<BrandLogoSize, { width: number; height: number }>
> = {
  authLogin: { width: 142, height: 50 },
  authLoginMobile: { width: 156, height: 55 },
  authLoginAside: { width: 150, height: 48 },
  authLoginDesktop: { width: 118, height: 56 },
  mobileSheet: { width: 188, height: 52 },
};

interface BrandLogoProps {
  size?: BrandLogoSize;
  className?: string;
  alt?: string;
  priority?: boolean;
  /** Override default brand asset path. */
  src?: string;
  /** Use square ICTF.svg mark (nav, footer, dark surfaces). */
  mark?: boolean;
  light?: boolean;
  fill?: boolean;
}

function isSvgSrc(src: string): boolean {
  return src.endsWith(".svg");
}

function layoutWidth(
  height: number,
  aspectWidth: number = BRAND.logoWidth,
  aspectHeight: number = BRAND.logoHeight
): number {
  const aspect = aspectWidth / aspectHeight;
  return Math.round(height * aspect);
}

export function BrandLogo({
  size = "md",
  className,
  alt = BRAND.name,
  priority,
  src: srcOverride,
  mark,
  light,
  fill,
}: BrandLogoProps) {
  const src = srcOverride ?? (mark ? BRAND.logoMark : light ? BRAND.logoLight : BRAND.logo);
  const isSvg = isSvgSrc(src);
  const isVectorWordmark = src === BRAND.logoNav || src === BRAND.logoFooter;
  const dbDriven = DB_DRIVEN_SIZES.has(size);
  const markLayout = mark ? MARK_LAYOUT_PX[size] : undefined;
  const pngLayout = !mark && !light && !dbDriven ? PNG_LAYOUT_PX[size] : undefined;
  const wordmarkLayout = !mark && !light && !dbDriven ? WORDMARK_LAYOUT_PX[size] : undefined;
  const layout = markLayout ?? pngLayout ?? wordmarkLayout;
  const height = layout?.height ?? DISPLAY_HEIGHT_PX[size];
  const width =
    layout?.width ??
    (mark
      ? height
      : isVectorWordmark
        ? layoutWidth(
            height,
            src === BRAND.logoFooter ? BRAND.logoFooterWidth : BRAND.logoNavWidth,
            src === BRAND.logoFooter ? BRAND.logoFooterHeight : BRAND.logoNavHeight
          )
        : layoutWidth(height));
  const isPngLayout = Boolean(pngLayout);

  const imageClassName = cn(
    "brand-logo-img block h-full w-full max-w-none shrink-0 leading-none",
    mark || isSvg || isPngLayout || light || dbDriven || isVectorWordmark || wordmarkLayout
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
      data-brand-logo-size={size}
      className="inline-block shrink-0 overflow-hidden leading-none"
      style={dbDriven ? undefined : { width, height }}
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
