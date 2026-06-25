"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LanguageToggle } from "@/components/landing/language-toggle";
import { NavBrand } from "@/components/landing/nav-brand";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { MarketingSectionLink } from "@/components/shared/marketing-section-link";
import { MARKETING_NAV_LINKS } from "@/lib/marketing-nav";
import { useMarketingText } from "@/hooks/use-marketing-text";

const navLinkClass =
  "whitespace-nowrap text-sm font-medium text-white/60 transition-colors hover:text-white";

const headerActionClass =
  "inline-flex h-8 shrink-0 items-center rounded-lg bg-white px-4 text-sm font-semibold text-black transition-colors hover:bg-zinc-100";

const mobileRegisterClass =
  "inline-flex h-8 shrink-0 items-center rounded-lg bg-white px-3.5 text-xs font-semibold text-black transition-colors hover:bg-zinc-100";

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const [activeHash, setActiveHash] = useState("");
  const pathname = usePathname();
  const { t } = useMarketingText();

  const portalHref = "/login";
  const portalLabel = t("btn.login");

  useEffect(() => {
    const updateHash = () => {
      setActiveHash(window.location.hash);
      setOpen(false);
    };
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return undefined;
  }, [open]);

  const closeMobile = () => setOpen(false);

  const sectionLink = (href: string, label: string, onClick?: () => void, mobile = false) => {
    const isActive = activeHash === href || (href === "#programs" && !activeHash && pathname === "/");

    if (href.startsWith("/")) {
      return (
        <Link
          key={href}
          href={href}
          className={cn(
            navLinkClass,
            mobile && "flex min-h-11 items-center py-2 text-base",
            pathname === href && "text-white"
          )}
          onClick={onClick}
        >
          {label}
        </Link>
      );
    }

    return (
      <MarketingSectionLink
        key={href}
        hash={href}
        className={cn(navLinkClass, mobile && "flex min-h-11 items-center py-2 text-base", isActive && "text-white")}
        onClick={onClick}
      >
        {label}
      </MarketingSectionLink>
    );
  };

  const desktopNavLinks = MARKETING_NAV_LINKS.map((l) => sectionLink(l.href, t(l.labelKey)));

  return (
    <header
      data-marketing-header
      className="pointer-events-none fixed inset-x-0 top-0 z-50 px-1 sm:px-2 md:left-1/2 md:w-full md:max-w-[52rem] md:-translate-x-1/2 md:px-3"
    >
      <nav
        className={cn(
          "marketing-nav-supaste pointer-events-auto bg-black",
          open && "marketing-nav-supaste--open"
        )}
      >
        <div className="flex min-h-[52px] items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-4 md:min-h-[53px] md:px-4 md:py-2.5">
          <NavBrand className="shrink-0" />

          <div className="hidden items-center gap-[1.875rem] md:flex">
            {desktopNavLinks}
            <LanguageToggle className="border-white/10 bg-white/5" />
            <Link
              href={portalHref}
              className={cn(navLinkClass, "text-white/80 hover:text-white")}
            >
              {portalLabel}
            </Link>
            <Link href="/register" className={headerActionClass}>
              {t("btn.registerNav")}
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-2 md:hidden">
            <Link href="/register" className={mobileRegisterClass}>
              {t("btn.registerNav")}
            </Link>
            <button
              type="button"
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white",
                open && "bg-white/10 text-white"
              )}
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              {open ? <X className="size-5" strokeWidth={2} /> : <Menu className="size-5" strokeWidth={2} />}
            </button>
          </div>
        </div>

        <div
          className={cn(
            "marketing-nav-drawer border-t border-white/10 md:hidden",
            open ? "max-h-[min(80vh,28rem)] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="flex max-h-[min(80vh,28rem)] flex-col gap-0.5 overflow-y-auto px-3 pb-4 pt-3">
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-icvf-accent">
              {t("hero.badge")}
            </p>
            {MARKETING_NAV_LINKS.map((l) => (
              <div key={l.href} className="rounded-lg px-2 hover:bg-white/5">
                {sectionLink(l.href, t(l.labelKey), closeMobile, true)}
              </div>
            ))}
            <div className="my-2 flex min-h-11 items-center justify-between px-2">
              <span className="text-xs font-medium text-white/50">Language</span>
              <LanguageToggle className="border-white/10 bg-white/5" />
            </div>
            <div className="rounded-lg px-2 hover:bg-white/5">
              <Link
                href={portalHref}
                onClick={closeMobile}
                className={cn(navLinkClass, "flex min-h-11 items-center py-2 text-base")}
              >
                {portalLabel}
              </Link>
            </div>
            <Link
              href="/register"
              onClick={closeMobile}
              className="mx-1 mt-1 inline-flex min-h-11 items-center justify-center rounded-lg bg-icvf-accent text-sm font-semibold text-icvf-navy-dark hover:bg-icvf-accent-hover"
            >
              {t("btn.register")}
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
