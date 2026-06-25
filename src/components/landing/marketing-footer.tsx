"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { BRAND } from "@/lib/constants";
import { Logo } from "@/components/shared/logo";
import { LanguageToggle } from "@/components/landing/language-toggle";
import { SecurityComplianceBadges } from "@/components/shared/security-compliance-badges";
import { MarketingFooterJaffnaStrip } from "@/components/landing/marketing-footer-jaffna-strip";
import { resolveMarketingHref } from "@/lib/marketing-nav";
import { handleMarketingSectionClick } from "@/lib/marketing-scroll";
import { PORTAL_ACCESS } from "@/lib/portal-access";
import { useMarketingText } from "@/hooks/use-marketing-text";
import { cn } from "@/lib/utils";

const FOOTER_PORTAL_COMING_SOON = {
  "Parent Portal": {
    href: "/coming-soon/parent",
    enabled: !PORTAL_ACCESS.parent,
  },
  "Teacher Portal": {
    href: "/coming-soon/teacher",
    enabled: !PORTAL_ACCESS.teacher,
  },
} as const;

function FooterComingSoonBadge({ label }: { label: string }) {
  return (
    <span className="ml-2 inline-flex shrink-0 rounded-full bg-icvf-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-icvf-accent">
      {label}
    </span>
  );
}

export function MarketingFooter() {
  const pathname = usePathname();
  const { t } = useMarketingText();
  const hashHref = (href: string) => resolveMarketingHref(href, pathname);
  const comingSoonLabel = t("auth.comingSoon");

  const hashLink = (href: string, label: string) => (
    <a
      href={hashHref(href)}
      className="text-sm text-white/60 transition-colors hover:text-white"
      onClick={(event) => handleMarketingSectionClick(event, href, pathname)}
    >
      {label}
    </a>
  );

  return (
    <footer className="border-t border-white/10 bg-gradient-to-b from-icvf-navy via-icvf-navy to-icvf-navy-dark text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:py-20">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo light size="footer" linked={false} />
            <p className="mt-4 text-sm font-medium text-white/80">
              {BRAND.name} — {BRAND.fullName}
            </p>
            <p className="mt-1 text-sm leading-relaxed break-words text-white/60">{BRAND.legalName}</p>
            <p className="mt-3 text-sm leading-relaxed text-white/50">
              O/L & A/L ICT tuition, Zoom classes, paper center practice, and the {BRAND.platformName} — islandwide.
            </p>
            <div className="mt-4 space-y-1 text-sm leading-relaxed break-words text-white/50">
              <p>{BRAND.contact.email}</p>
              <p>{BRAND.contact.phone}</p>
              <p>{BRAND.contact.address}</p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Quick Links</h4>
            <ul className="mt-4 space-y-2">
              {BRAND.footerLinks.quick.map((link) => (
                <li key={link.label}>{hashLink(link.href, link.label)}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Our Programs</h4>
            <ul className="mt-4 space-y-2">
              {BRAND.footerLinks.courses.map((link) => (
                <li key={link.label}>{hashLink(link.href, link.label)}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Portal Access</h4>
            <ul className="mt-4 space-y-2">
              {BRAND.footerLinks.portal.map((link) => {
                const comingSoon = FOOTER_PORTAL_COMING_SOON[link.label as keyof typeof FOOTER_PORTAL_COMING_SOON];
                const href = comingSoon?.enabled ? comingSoon.href : link.href;

                return (
                  <li key={link.label}>
                    {link.href.startsWith("#") || link.href.includes("#") ? (
                      hashLink(link.href, link.label)
                    ) : (
                      <Link
                        href={href}
                        className={cn(
                          "inline-flex flex-wrap items-center gap-x-1 text-sm text-white/60 transition-colors hover:text-white",
                          comingSoon?.enabled && "hover:text-white/80"
                        )}
                      >
                        {link.label}
                        {comingSoon?.enabled ? <FooterComingSoonBadge label={comingSoonLabel} /> : null}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="mt-10">
          <SecurityComplianceBadges variant="marketing" className="w-full max-w-full" />
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 border-t border-white/10 pt-8 md:flex-row md:justify-between">
          <p className="text-center text-sm text-white/40 md:text-left">
            &copy; {new Date().getFullYear()} {BRAND.legalName}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <p className="text-xs text-white/35">{BRAND.platformName}</p>
          </div>
        </div>
      </div>

      <MarketingFooterJaffnaStrip />
    </footer>
  );
}
