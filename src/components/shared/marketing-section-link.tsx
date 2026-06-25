"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getMarketingSectionHref, handleMarketingSectionClick } from "@/lib/marketing-scroll";
import { cn } from "@/lib/utils";

interface MarketingSectionLinkProps extends Omit<React.ComponentProps<typeof Link>, "href"> {
  hash: string;
  href?: React.ComponentProps<typeof Link>["href"];
}

/** In-page section link that smooth-scrolls on `/` and routes to `/#section` elsewhere. */
export function MarketingSectionLink({
  hash,
  href,
  onClick,
  className,
  children,
  ...props
}: MarketingSectionLinkProps) {
  const pathname = usePathname();
  const resolvedHref = href ?? getMarketingSectionHref(hash, pathname);

  return (
    <Link
      href={resolvedHref}
      className={cn(className)}
      onClick={(event) => {
        handleMarketingSectionClick(event, hash, pathname);
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </Link>
  );
}
