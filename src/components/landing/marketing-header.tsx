"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LanguageToggle } from "@/components/landing/language-toggle";
import { NavBrand } from "@/components/landing/nav-brand";
import { MarketingSectionLink } from "@/components/shared/marketing-section-link";
import { MiniNavbar, type MiniNavbarLink } from "@/components/ui/mini-navbar";
import { useMarketingText } from "@/hooks/use-marketing-text";
import { MARKETING_NAV_LINKS } from "@/lib/marketing-nav";
import { cn } from "@/lib/utils";

const animatedLinkClass =
  "group relative inline-block h-5 overflow-hidden text-sm leading-5";

const animatedLinkInner = (label: string) => (
  <div className="flex flex-col transition-transform duration-[400ms] ease-out group-hover:-translate-y-1/2">
    <span className="block h-5 leading-5 text-white/55">{label}</span>
    <span className="block h-5 leading-5 text-white">{label}</span>
  </div>
);

export function MarketingHeader() {
  const [activeHash, setActiveHash] = useState("");
  const pathname = usePathname();
  const { t } = useMarketingText();

  useEffect(() => {
    const updateHash = () => setActiveHash(window.location.hash);
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, [pathname]);

  const links: MiniNavbarLink[] = MARKETING_NAV_LINKS.map((l) => ({
    key: l.href,
    label: t(l.labelKey),
    href: l.href,
  }));

  const renderLink = (link: MiniNavbarLink, variant: "desktop" | "mobile", closeMenu: () => void) => {
    const hashFromHref = link.href.startsWith("#")
      ? link.href
      : link.href.includes("#")
        ? `#${link.href.split("#")[1]}`
        : null;
    const isActive =
      (hashFromHref && activeHash === hashFromHref) ||
      (link.href === "#programs" && !activeHash && pathname === "/");

    if (hashFromHref) {
      if (variant === "desktop") {
        return (
          <MarketingSectionLink
            key={link.key}
            hash={hashFromHref}
            className={cn(animatedLinkClass, isActive && "[&_span:first-child]:text-white")}
          >
            {animatedLinkInner(link.label)}
          </MarketingSectionLink>
        );
      }
      return (
        <MarketingSectionLink
          key={link.key}
          hash={hashFromHref}
          onClick={variant === "mobile" ? closeMenu : undefined}
          className={cn(
            "w-full text-center text-base text-white/55 transition-colors hover:text-white",
            isActive && "text-white"
          )}
        >
          {link.label}
        </MarketingSectionLink>
      );
    }

    if (variant === "desktop") {
      return (
        <Link
          key={link.key}
          href={link.href}
          className={cn(animatedLinkClass, pathname === link.href && "[&_span:first-child]:text-white")}
        >
          {animatedLinkInner(link.label)}
        </Link>
      );
    }

    return (
      <Link
        key={link.key}
        href={link.href}
        onClick={closeMenu}
        className={cn(
          "w-full text-center text-base text-white/55 transition-colors hover:text-white",
          pathname === link.href && "text-white"
        )}
      >
        {link.label}
      </Link>
    );
  };

  return (
    <MiniNavbar
      logo={<NavBrand />}
      links={links}
      loginHref="/login"
      loginLabel={t("btn.login")}
      registerHref="/register"
      registerLabel={t("btn.registerNav")}
      mobileBadge={t("hero.badge")}
      extraActions={<LanguageToggle monochrome className="border-white/15 bg-white/5" />}
      renderLink={renderLink}
    />
  );
}
