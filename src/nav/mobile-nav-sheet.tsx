"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { MarketingSectionLink } from "@/components/shared/marketing-section-link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MarketingSessionActions } from "@/components/landing/marketing-session-actions";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMarketingText } from "@/hooks/use-marketing-text";
import { cn } from "@/lib/utils";
import { useMarketingProgramLinks } from "@/nav/nav-menu";

const mobileNavLinkClass =
  "marketing-mobile-sheet-link block w-full touch-manipulation py-2.5 text-left text-base font-medium text-icvf-navy no-underline transition-colors hover:text-icvf-navy-dark";

const mobileProgramsTriggerClass =
  "marketing-mobile-sheet-programs !flex !w-full !flex-none !items-center !justify-between !gap-2 !py-2.5 !text-left text-base font-medium !text-icvf-navy hover:!text-icvf-navy-dark hover:no-underline focus-visible:!ring-0 [&_[data-slot=accordion-trigger-icon]]:!ml-0 [&_[data-slot=accordion-trigger-icon]]:!size-4 [&_[data-slot=accordion-trigger-icon]]:!text-icvf-navy/50";

interface MobileNavSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logo: ReactNode;
  loginHref: string;
  registerHref: string;
  extraActions?: ReactNode;
}

export function MobileNavSheet({
  open,
  onOpenChange,
  logo,
  loginHref,
  registerHref,
  extraActions,
}: MobileNavSheetProps) {
  const { t } = useMarketingText();
  const pathname = usePathname();
  const programLinks = useMarketingProgramLinks();

  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="marketing-mobile-sheet !inset-y-3 !right-3 !left-auto !h-auto !w-[min(calc(100%-1.5rem),21rem)] !max-w-none gap-0 rounded-2xl border border-icvf-navy/10 bg-white p-0 shadow-2xl data-ending-style:translate-x-4 data-starting-style:translate-x-4 lg:hidden"
      >
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>

        <div className="flex items-center justify-between gap-3 border-b border-icvf-navy/8 px-5 py-4">
          <div className="min-w-0 [&_.marketing-nav-brand]:h-9 [&_.marketing-nav-brand]:max-h-9 [&_[data-brand-logo]]:!h-9 [&_[data-brand-logo]]:!max-w-[9.5rem]">
            {logo}
          </div>
          <button
            type="button"
            className="flex size-9 shrink-0 touch-manipulation items-center justify-center rounded-full text-icvf-navy/70 transition-colors hover:bg-icvf-navy/5 hover:text-icvf-navy"
            onClick={close}
            aria-label="Close menu"
          >
            <X className="size-5" strokeWidth={2} />
          </button>
        </div>

        <div className="marketing-nav-mobile-panel flex flex-1 flex-col overflow-y-auto px-5 py-4">
          <nav className="flex w-full flex-col gap-1 text-base">
            <Accordion className="w-full border-0">
              <AccordionItem value="programs" className="border-0">
                <AccordionTrigger className={mobileProgramsTriggerClass}>
                  {t("nav.programs")}
                </AccordionTrigger>
                <AccordionContent className="pb-0 pl-1 [&>div]:pb-2">
                  <ul className="flex flex-col gap-0.5 border-l border-icvf-navy/10 pl-3">
                    {programLinks.map((link) => (
                      <li key={link.href}>
                        {link.disabled ? (
                          <span className="block py-2 text-sm text-icvf-navy/40">{link.title}</span>
                        ) : (
                          <Link href={link.href} onClick={close} className={mobileNavLinkClass}>
                            {link.title}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <MarketingSectionLink hash="#about" onClick={close} className={mobileNavLinkClass}>
              {t("nav.about")}
            </MarketingSectionLink>
            <Link
              href="/rankings"
              onClick={close}
              className={cn(
                mobileNavLinkClass,
                pathname === "/rankings" && "font-semibold text-icvf-navy-dark"
              )}
            >
              {t("nav.results")}
            </Link>
            <MarketingSectionLink hash="#faq" onClick={close} className={mobileNavLinkClass}>
              {t("nav.faq")}
            </MarketingSectionLink>
            <MarketingSectionLink hash="#contact" onClick={close} className={mobileNavLinkClass}>
              {t("nav.contact")}
            </MarketingSectionLink>
          </nav>

          {extraActions ? (
            <div className="marketing-mobile-sheet-actions mt-6 flex items-center">{extraActions}</div>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 border-t border-icvf-navy/8 pt-5">
            <div className="marketing-nav-mobile-menu-register flex justify-center">
              <MarketingSessionActions
                variant="nav-mobile-register"
                loginHref={loginHref}
                registerHref={registerHref}
                onNavigate={close}
              />
            </div>
            <MarketingSessionActions
              variant="nav-mobile-sheet"
              loginHref={loginHref}
              registerHref={registerHref}
              onNavigate={close}
              className={cn(mobileNavLinkClass, "text-center")}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
