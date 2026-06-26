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

export interface MarketingNavbarProps {
  logo: ReactNode;
  loginHref: string;
  registerHref: string;
  mobileBadge?: string;
  extraActions?: ReactNode;
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
  loginHref,
  registerHref,
  mobileBadge: _mobileBadge,
  extraActions,
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
          "pointer-events-auto fixed top-4 left-1/2 z-50 h-14 w-[calc(100%-1.25rem)] max-w-[min(100%,var(--breakpoint-xl))] -translate-x-1/2 rounded-full border border-white/10 bg-icvf-navy shadow-[0_10px_32px_-12px_rgba(0,0,0,0.55)] sm:top-6 sm:h-16 sm:w-[calc(100%-2rem)] lg:w-fit"
        )}
      >
        <div className="grid h-full w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 px-3 sm:gap-3 sm:px-4 lg:hidden">
          <div className="min-w-0 justify-self-start">{logo}</div>
          <div className="justify-self-end">
            <MarketingSessionActions
              variant="nav-mobile-register"
              loginHref={loginHref}
              registerHref={registerHref}
              onNavigate={closeMobile}
            />
          </div>
          <button
            type="button"
            className="flex size-10 shrink-0 touch-manipulation items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition-transform active:scale-95 sm:size-9"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
          >
            <Menu className="size-5" strokeWidth={2} />
          </button>
        </div>

        <div className="relative mx-auto hidden h-16 w-full min-w-0 items-center gap-5 px-5 lg:flex">
          <div className="min-w-0 shrink-0">{logo}</div>

          <NavMenu className="relative w-max max-w-none flex-none" />

          <div className="h-4 w-px shrink-0 bg-white/12" aria-hidden />

          <div className="flex shrink-0 items-center gap-3">
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
      </header>

      <MobileNavSheet
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        logo={logo}
        loginHref={loginHref}
        registerHref={registerHref}
        extraActions={extraActions}
      />
    </AuthProvider>
  );
}

export default MarketingNavbar;
