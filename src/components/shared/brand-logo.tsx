import Image from "next/image";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";

const sizeClasses = {
  xs: "h-6 w-auto max-w-[5.5rem]",
  sm: "h-8 w-auto max-w-[7rem]",
  md: "h-10 w-auto max-w-[9rem]",
  lg: "h-12 w-auto max-w-[11rem] sm:h-14 sm:max-w-[13rem]",
  xl: "h-16 w-auto max-w-[15rem]",
  nav: "h-7 w-auto max-w-[5.75rem] sm:h-8 sm:max-w-[6.5rem]",
} as const;

export type BrandLogoSize = keyof typeof sizeClasses;

interface BrandLogoProps {
  size?: BrandLogoSize;
  className?: string;
  alt?: string;
  priority?: boolean;
  /** White mark for dark backgrounds (nav, footer, portal sidebar). */
  light?: boolean;
  /** Fill a positioned parent (parent must be `relative` with explicit size). */
  fill?: boolean;
}

export function BrandLogo({
  size = "md",
  className,
  alt = BRAND.name,
  priority,
  light,
  fill,
}: BrandLogoProps) {
  const imageClassName = cn(
    "shrink-0 object-contain object-left",
    !fill && sizeClasses[size],
    className
  );
  const src = light ? BRAND.logoLight : BRAND.logo;

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        priority={priority}
        className={imageClassName}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={BRAND.logoWidth}
      height={BRAND.logoHeight}
      unoptimized
      priority={priority}
      className={imageClassName}
    />
  );
}
