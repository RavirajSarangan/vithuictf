"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useOptionalAuth, getRoleRedirect } from "@/providers/auth-provider";
import { useMarketingText } from "@/hooks/use-marketing-text";
import { ButtonLink } from "@/components/shared/button-link";
import { cn } from "@/lib/utils";

const navRegisterButtonClass =
  "marketing-nav-register relative z-10 h-8 min-h-8 px-3 text-[11px] sm:h-9 sm:min-h-9 sm:px-4 sm:text-sm shadow-[0_0_24px_-8px_rgba(245,166,35,0.95)]";

function NavRegisterButton({
  href,
  onClick,
  children,
  compact = false,
}: {
  href: string;
  onClick?: () => void;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cn("group relative shrink-0", compact && "marketing-nav-register-compact")}>
      {!compact ? (
        <div
          className="pointer-events-none absolute inset-0 -m-1 rounded-full bg-icvf-accent/45 opacity-70 blur-md transition-all duration-300 ease-out group-hover:-m-1.5 group-hover:opacity-90 group-hover:blur-lg"
          aria-hidden
        />
      ) : null}
      <ButtonLink
        href={href}
        onClick={onClick}
        variant="icvf"
        className={cn(navRegisterButtonClass, compact && "h-8 min-h-8 px-3 text-[11px] shadow-none")}
      >
        {children}
      </ButtonLink>
    </div>
  );
}

const heroCtaClass =
  "hero-cta-btn inline-flex min-h-[3.25rem] w-full items-center justify-center gap-1.5 overflow-visible rounded-full px-3 py-3 text-xs font-semibold leading-normal sm:min-h-14 sm:gap-2 sm:px-5 sm:py-0 sm:text-sm active:translate-y-0 lg:w-auto lg:min-w-[11.25rem]";

type MarketingSessionVariant =
  | "hero"
  | "nav-desktop-login"
  | "nav-desktop-register"
  | "nav-mobile-register"
  | "nav-mobile-sheet";

export interface MarketingSessionActionsProps {
  variant: MarketingSessionVariant;
  loginHref?: string;
  registerHref?: string;
  onNavigate?: () => void;
  className?: string;
}

export function MarketingSessionActions({
  variant,
  loginHref = "/login",
  registerHref = "/register",
  onNavigate,
  className,
}: MarketingSessionActionsProps) {
  const auth = useOptionalAuth();
  const user = auth?.user ?? null;
  const loading = auth?.loading ?? false;
  const { t } = useMarketingText();

  const handleSignOut = async () => {
    onNavigate?.();
    if (auth) {
      await auth.signOut("/");
    }
  };

  if (loading) {
    if (variant === "hero") {
      return (
        <div className={cn("hero-cta-section", className)} aria-hidden>
          <div className="hero-cta-row min-h-[3.25rem] opacity-0 sm:min-h-14" />
        </div>
      );
    }
    return null;
  }

  if (user) {
    const portalHref = getRoleRedirect(user.role);

    if (variant === "hero") {
      return (
        <div className={cn("hero-cta-section", className)}>
          <div className="hero-cta-row">
            <ButtonLink href={portalHref} variant="icvf" className={heroCtaClass}>
              {t("btn.dashboard")}
            </ButtonLink>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className={cn(
                heroCtaClass,
                "border border-icvf-navy/20 bg-white text-icvf-navy hover:border-icvf-navy/40 hover:bg-icvf-surface"
              )}
            >
              {t("btn.signOut")}
            </button>
          </div>
        </div>
      );
    }

    if (variant === "nav-desktop-register" || variant === "nav-mobile-register") {
      return (
        <NavRegisterButton
          href={portalHref}
          onClick={onNavigate}
          compact={variant === "nav-mobile-register"}
        >
          {t("btn.dashboard")}
        </NavRegisterButton>
      );
    }

    if (variant === "nav-desktop-login") {
      return (
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="marketing-nav-link shrink-0 border-0 bg-transparent p-0"
        >
          {t("btn.signOut")}
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={() => void handleSignOut()}
        className={cn(
          "marketing-nav-link block w-full px-3 py-2.5 text-center text-base hover:bg-white/10",
          className
        )}
      >
        {t("btn.signOut")}
      </button>
    );
  }

  if (variant === "hero") {
    return (
      <div className={cn("hero-cta-section", className)}>
        <div className="hero-cta-row">
          <ButtonLink href={registerHref} variant="icvf" className={heroCtaClass}>
            <span className="sm:hidden">{t("btn.registerNav")}</span>
            <span className="hidden sm:inline">{t("btn.register")}</span>
          </ButtonLink>
          <ButtonLink href={loginHref} variant="icvf-outline-navy" className={heroCtaClass}>
            {t("btn.login")}
          </ButtonLink>
        </div>
      </div>
    );
  }

  if (variant === "nav-desktop-register" || variant === "nav-mobile-register") {
    return (
      <NavRegisterButton
        href={registerHref}
        onClick={onNavigate}
        compact={variant === "nav-mobile-register"}
      >
        {t("btn.registerNav")}
      </NavRegisterButton>
    );
  }

  if (variant === "nav-desktop-login") {
    return (
      <Link href={loginHref} className="marketing-nav-link shrink-0 text-white/85 hover:text-white">
        {t("btn.login")}
      </Link>
    );
  }

  return (
    <Link
      href={loginHref}
      onClick={onNavigate}
      className={cn(
        "marketing-nav-link block text-center text-base text-white/85 hover:text-white",
        className
      )}
    >
      {t("btn.login")}
    </Link>
  );
}
