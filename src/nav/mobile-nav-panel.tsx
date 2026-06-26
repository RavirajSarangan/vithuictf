"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { MarketingSectionLink } from "@/components/shared/marketing-section-link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MarketingSessionActions } from "@/components/landing/marketing-session-actions";
import { useMarketingText } from "@/hooks/use-marketing-text";
import { cn } from "@/lib/utils";
import { useMarketingProgramLinks } from "@/nav/nav-menu";

const mobileNavLinkClass =
  "marketing-nav-link block w-full touch-manipulation py-1 text-center text-base font-medium text-white/85 no-underline transition-colors hover:text-white";

const mobileProgramsTriggerClass =
  "marketing-nav-mobile-programs !flex !w-full !flex-none !items-center !justify-center !gap-1.5 self-center !py-2.5 !text-center text-base font-medium !text-white/85 hover:!text-white hover:no-underline focus-visible:!ring-0 [&_[data-slot=accordion-trigger-icon]]:!ml-0 [&_[data-slot=accordion-trigger-icon]]:!size-3.5 [&_[data-slot=accordion-trigger-icon]]:!text-white/60";

interface MobileNavPanelProps {
  loginHref: string;
  registerHref: string;
  extraActions?: ReactNode;
  onClose: () => void;
}

export function MobileNavPanel({
  loginHref,
  registerHref,
  extraActions,
  onClose,
}: MobileNavPanelProps) {
  const { t } = useMarketingText();
  const pathname = usePathname();
  const programLinks = useMarketingProgramLinks();

  return (
    <div className="marketing-nav-mobile-panel flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 lg:hidden">
      <nav className="flex w-full flex-col items-center gap-3 text-base">
        <Accordion className="w-full max-w-xs border-0">
          <AccordionItem value="programs" className="border-0">
            <AccordionTrigger className={mobileProgramsTriggerClass}>
              {t("nav.programs")}
            </AccordionTrigger>
            <AccordionContent className="pb-0 [&>div]:pb-1">
              <ul className="flex flex-col items-center gap-2">
                {programLinks.map((link) => (
                  <li key={link.href} className="w-full text-center">
                    {link.disabled ? (
                      <span className="text-sm text-white/45">{link.title}</span>
                    ) : (
                      <Link href={link.href} onClick={onClose} className={mobileNavLinkClass}>
                        {link.title}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <MarketingSectionLink hash="#about" onClick={onClose} className={mobileNavLinkClass}>
          {t("nav.about")}
        </MarketingSectionLink>
        <Link
          href="/rankings"
          onClick={onClose}
          className={cn(mobileNavLinkClass, pathname === "/rankings" && "is-active text-white")}
        >
          {t("nav.results")}
        </Link>
        <MarketingSectionLink hash="#faq" onClick={onClose} className={mobileNavLinkClass}>
          {t("nav.faq")}
        </MarketingSectionLink>
        <MarketingSectionLink hash="#contact" onClick={onClose} className={mobileNavLinkClass}>
          {t("nav.contact")}
        </MarketingSectionLink>
      </nav>

      {extraActions ? (
        <div className="mt-5 flex items-center justify-center">{extraActions}</div>
      ) : null}

      <div className="mt-5 flex flex-col items-center gap-3">
        <div className="marketing-nav-mobile-menu-register">
          <MarketingSessionActions
            variant="nav-mobile-register"
            loginHref={loginHref}
            registerHref={registerHref}
            onNavigate={onClose}
          />
        </div>
        <MarketingSessionActions
          variant="nav-mobile-sheet"
          loginHref={loginHref}
          registerHref={registerHref}
          onNavigate={onClose}
          className="text-base font-medium text-white/85 hover:text-white"
        />
      </div>
    </div>
  );
}
