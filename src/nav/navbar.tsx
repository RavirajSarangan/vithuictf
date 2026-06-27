"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { MarketingSessionActions } from "@/components/landing/marketing-session-actions";
import { applyMarketingScrollPadding } from "@/lib/marketing-scroll";
import { AuthProvider } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";
import { MobileNavSheet } from "@/nav/mobile-nav-sheet";
import { NavMenu } from "@/nav/nav-menu";
import { Banner } from "@/components/ui/banner";
import type { MarketingAnnouncement } from "@/types";

export interface MarketingNavbarProps {
  logo: ReactNode;
  sheetLogo?: ReactNode;
  loginHref: string;
  registerHref: string;
  mobileBadge?: string;
  extraActions?: ReactNode;
  announcement?: MarketingAnnouncement | null;
}

function useMarketingHeaderOffsetSync(pathname: string) {
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return undefined;

    const sync = () => applyMarketingScrollPadding();

    sync();
    window.addEventListener("resize", sync);

    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(sync) : null;
    observer?.observe(header);

    return () => {
      window.removeEventListener("resize", sync);
      observer?.disconnect();
    };
  }, [pathname]);

  return headerRef;
}

export function MarketingNavbar({
  logo,
  sheetLogo,
  loginHref,
  registerHref,
  mobileBadge: _mobileBadge,
  extraActions,
  announcement,
}: MarketingNavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const headerRef = useMarketingHeaderOffsetSync(pathname);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <AuthProvider deferred>
      <header
        ref={headerRef}
        data-marketing-header
        data-mobile-open={mobileOpen ? "true" : undefined}
        className={cn(
          "pointer-events-auto fixed top-4 left-1/2 z-50 w-[calc(100%-1.25rem)] max-w-[min(100%,var(--breakpoint-xl))] -translate-x-1/2 sm:top-6 sm:w-[calc(100%-2rem)] lg:w-fit lg:max-w-[calc(100vw-2rem)] xl:max-w-none"
        )}
      >
        <div
          className={cn(
            "flex h-16 w-full flex-col rounded-full border border-white/10 bg-icvf-navy shadow-[0_10px_32px_-12px_rgba(0,0,0,0.55)]"
          )}
        >
          <div className="marketing-nav-mobile-bar flex h-full w-full items-center justify-between gap-3 pl-3 pr-4 sm:pl-3.5 sm:pr-5 lg:hidden">
            <div className="marketing-nav-mobile-logo shrink-0 overflow-visible">
              {logo}
            </div>

            <div className="marketing-nav-mobile-actions flex shrink-0 items-center gap-2">
              <MarketingSessionActions
                variant="nav-mobile-register"
                loginHref={loginHref}
                registerHref={registerHref}
                onNavigate={closeMobile}
              />
              <button
                type="button"
                className="flex size-10 shrink-0 touch-manipulation items-center justify-center rounded-full border border-white/30 bg-white/10 text-white shadow-sm transition-transform active:scale-95"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                aria-expanded={mobileOpen}
              >
                <Menu className="size-[1.375rem]" strokeWidth={2.25} />
              </button>
            </div>
          </div>

          <div className="relative mx-auto hidden h-16 w-max max-w-full shrink-0 items-center gap-3 pl-3 pr-3 sm:gap-4 sm:pl-3.5 sm:pr-4 lg:flex xl:gap-5 xl:pl-4 xl:pr-5">
            <div className="shrink-0">{logo}</div>

            <NavMenu className="relative shrink-0" />

            <div className="h-4 w-px shrink-0 bg-white/12" aria-hidden />

            <div className="flex shrink-0 items-center gap-2 pl-0.5 xl:gap-3">
              {extraActions}
              <MarketingSessionActions
                variant="nav-desktop-login"
                loginHref={loginHref}
                registerHref={registerHref}
              />
              <MarketingSessionActions
                variant="nav-desktop-register"
                loginHref={loginHref}
                registerHref={registerHref}
              />
            </div>
          </div>
        </div>

        {announcement && announcement.displayStyle === "banner" && announcement.isActive && (
          <div className="mt-2 w-full">
            <Banner
              id={announcement.id}
              variant="rainbow"
              className="rounded-full border border-white/10 text-white shadow-lg overflow-hidden py-0"
              height="2.5rem"
              changeLayout={false}
            >
              <span className="flex items-center gap-2 px-6">
                <span className="font-semibold text-xs sm:text-sm">{announcement.title}</span>
                {announcement.body && <span className="opacity-95 text-xs sm:text-sm">— {announcement.body}</span>}
                {announcement.ctaUrl && (
                  <a
                    href={announcement.ctaUrl}
                    target={announcement.ctaUrl.startsWith("http") ? "_blank" : undefined}
                    rel={announcement.ctaUrl.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="ml-2 rounded-full bg-white text-zinc-950 hover:bg-white/90 px-3 py-0.5 text-[10px] sm:text-xs font-semibold shadow transition-colors"
                  >
                    {announcement.ctaLabel || "Learn More"}
                  </a>
                )}
              </span>
            </Banner>
          </div>
        )}
      </header>

      <MobileNavSheet
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        logo={sheetLogo ?? logo}
        loginHref={loginHref}
        registerHref={registerHref}
      />
    </AuthProvider>
  );
}

export default MarketingNavbar;
