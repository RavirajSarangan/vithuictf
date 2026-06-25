import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface NavBrandProps {
  className?: string;
}

/** Supaste-style nav brand: compact light logo on dark bar */
export function NavBrand({ className }: NavBrandProps) {
  return (
    <Link
      href="/"
      className={cn("flex shrink-0 items-center", className)}
      aria-label={BRAND.name}
    >
      <Image
        src={BRAND.navIcon}
        alt={BRAND.name}
        width={BRAND.logoWidth}
        height={BRAND.logoHeight}
        unoptimized
        priority
        className="h-[30px] w-auto max-w-[7.5rem] shrink-0 object-contain object-left"
      />
    </Link>
  );
}
