import Link from "next/link";
import { BRAND } from "@/lib/constants";
import { BrandLogo, type BrandLogoSize } from "@/components/shared/brand-logo";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  light?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  /** What to show beside the mark when `showText` is true. */
  text?: "name" | "tagline" | "fullName";
  /** Show brand text on mobile (default: hidden below sm). */
  mobileText?: boolean;
  /** Link target when `linked` is true. */
  href?: string;
  /** When false, render mark/text without wrapping in a link. */
  linked?: boolean;
}

const logoSizeMap: Record<NonNullable<LogoProps["size"]>, BrandLogoSize> = {
  sm: "sm",
  md: "md",
  lg: "lg",
  xl: "xl",
};

export function Logo({
  className,
  showText = false,
  light,
  size = "md",
  text = "tagline",
  mobileText = false,
  href = "/",
  linked = true,
}: LogoProps) {
  const content = (
    <>
      <BrandLogo size={logoSizeMap[size]} priority light={light} />
      {showText ? (
        <span
          className={cn(
            "text-sm font-semibold tracking-tight",
            mobileText ? "block" : "hidden sm:block",
            light ? "text-white" : "text-icvf-text-light"
          )}
        >
          {text === "name" ? BRAND.name : text === "fullName" ? BRAND.fullName : BRAND.tagline}
        </span>
      ) : null}
    </>
  );

  if (!linked) {
    return <span className={cn("flex items-center gap-3", className)}>{content}</span>;
  }

  return (
    <Link href={href} className={cn("flex items-center gap-3", className)} aria-label={BRAND.name}>
      {content}
    </Link>
  );
}
