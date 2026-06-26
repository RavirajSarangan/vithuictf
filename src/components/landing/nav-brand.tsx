import Link from "next/link";
import { BrandLogo } from "@/components/shared/brand-logo";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface NavBrandProps {
  className?: string;
  /** `light` on navy header; `dark` on white mobile sheet. */
  tone?: "light" | "dark";
}

/** Wordmark for marketing nav surfaces. */
export function NavBrand({ className, tone = "light" }: NavBrandProps) {
  return (
    <Link
      href="/"
      className={cn(
        "marketing-nav-brand flex h-full min-w-0 items-center justify-start leading-none",
        tone === "dark" && "marketing-nav-brand--dark",
        className
      )}
      aria-label={BRAND.name}
    >
      <BrandLogo size="nav" light={tone === "light"} priority />
    </Link>
  );
}
