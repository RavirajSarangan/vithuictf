import Link from "next/link";
import { BrandLogo } from "@/components/shared/brand-logo";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface NavBrandProps {
  className?: string;
}

/** Compact light mark on the dark marketing header. */
export function NavBrand({ className }: NavBrandProps) {
  return (
    <Link
      href="/"
      className={cn("flex shrink-0 items-center", className)}
      aria-label={BRAND.name}
    >
      <BrandLogo size="nav" light priority />
    </Link>
  );
}
