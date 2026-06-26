"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export type MiniNavbarLink = {
  key: string;
  label: string;
  href: string;
};

export interface MiniNavbarProps {
  logo: ReactNode;
  links: MiniNavbarLink[];
  loginHref: string;
  loginLabel: string;
  registerHref: string;
  registerLabel: string;
  extraActions?: ReactNode;
  mobileBadge?: string;
  className?: string;
  renderLink?: (link: MiniNavbarLink, variant: "desktop" | "mobile", closeMenu: () => void) => ReactNode;
  onOpenChange?: (open: boolean) => void;
}

function AnimatedNavLink({
  href,
  children,
  className,
  onClick,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group relative inline-block h-5 overflow-hidden text-sm leading-5",
        className
      )}
    >
      <div className="flex flex-col transition-transform duration-[400ms] ease-out group-hover:-translate-y-1/2">
        <span className="block h-5 leading-5 text-white/55">{children}</span>
        <span className="block h-5 leading-5 text-white">{children}</span>
      </div>
    </Link>
  );
}

export function MiniNavbar({
  logo,
  links,
  loginHref,
  loginLabel,
  registerHref,
  registerLabel,
  extraActions,
  mobileBadge,
  className,
  renderLink,
  onOpenChange,
}: MiniNavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [headerShapeClass, setHeaderShapeClass] = useState("rounded-full");
  const shapeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setOpen = (next: boolean) => {
    setIsOpen(next);
    onOpenChange?.(next);
  };

  const toggleMenu = () => setOpen(!isOpen);

  useEffect(() => {
    if (shapeTimeoutRef.current) {
      clearTimeout(shapeTimeoutRef.current);
    }

    if (isOpen) {
      setHeaderShapeClass("rounded-2xl");
    } else {
      shapeTimeoutRef.current = setTimeout(() => {
        setHeaderShapeClass("rounded-full");
      }, 300);
    }

    return () => {
      if (shapeTimeoutRef.current) {
        clearTimeout(shapeTimeoutRef.current);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const closeMobile = () => setOpen(false);

  const desktopLink = (link: MiniNavbarLink) =>
    renderLink ? (
      renderLink(link, "desktop", closeMobile)
    ) : (
      <AnimatedNavLink key={link.key} href={link.href}>
        {link.label}
      </AnimatedNavLink>
    );

  const mobileLink = (link: MiniNavbarLink) =>
    renderLink ? (
      renderLink(link, "mobile", closeMobile)
    ) : (
      <Link
        key={link.key}
        href={link.href}
        onClick={closeMobile}
        className="w-full text-center text-base text-white/55 transition-colors hover:text-white"
      >
        {link.label}
      </Link>
    );

  const loginButton = (
    <Link
      href={loginHref}
      onClick={closeMobile}
      className="shrink-0 text-sm font-medium text-white/70 transition-colors hover:text-white"
    >
      {loginLabel}
    </Link>
  );

  const registerButton = (
    <div className="group relative shrink-0">
      <div
        className="pointer-events-none absolute inset-0 -m-1 rounded-full bg-icvf-accent/45 opacity-70 blur-md transition-all duration-300 ease-out group-hover:-m-1.5 group-hover:opacity-90 group-hover:blur-lg"
        aria-hidden
      />
      <Link
        href={registerHref}
        onClick={closeMobile}
        className="relative z-10 inline-flex h-8 items-center justify-center rounded-full bg-icvf-accent px-3.5 text-xs font-semibold text-icvf-navy-dark shadow-[0_0_24px_-8px_rgba(245,166,35,0.95)] transition-colors hover:bg-icvf-accent-hover sm:h-9 sm:px-4 sm:text-sm"
      >
        {registerLabel}
      </Link>
    </div>
  );

  return (
    <header
      data-marketing-header
      className={cn(
        "pointer-events-auto fixed left-1/2 top-1 z-50 w-fit max-w-[calc(100%-0.75rem)] -translate-x-1/2 border border-white/10 bg-black shadow-[0_10px_32px_-12px_rgba(0,0,0,0.55)] transition-[border-radius] duration-0 ease-in-out sm:top-1.5",
        headerShapeClass,
        className
      )}
    >
      <div className="flex min-h-11 w-full items-center justify-between gap-2 px-2.5 py-1 sm:w-auto sm:justify-start sm:gap-3 sm:px-3 sm:py-1.5">
        <div className="flex shrink-0 items-center">{logo}</div>

        <nav className="hidden items-center gap-2.5 whitespace-nowrap sm:flex sm:gap-3 lg:gap-3.5">
          {links.map(desktopLink)}
        </nav>

        <div className="hidden h-4 w-px shrink-0 bg-white/12 sm:block" aria-hidden />

        <div className="hidden items-center gap-2 sm:flex sm:gap-2">
          {extraActions}
          {loginButton}
          {registerButton}
        </div>

        <div className="flex items-center gap-2 sm:hidden">
          {registerButton}
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white focus:outline-none"
            onClick={toggleMenu}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="size-5" strokeWidth={2} /> : <Menu className="size-5" strokeWidth={2} />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden px-3 transition-all duration-300 ease-in-out sm:hidden",
          isOpen ? "max-h-[min(80vh,28rem)] pb-4 opacity-100" : "pointer-events-none max-h-0 pb-0 opacity-0"
        )}
      >
        {mobileBadge ? (
          <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
            {mobileBadge}
          </p>
        ) : null}
        <nav className="flex flex-col items-center gap-3 text-base">
          {links.map(mobileLink)}
        </nav>
        {extraActions ? (
          <div className="mt-3 flex items-center justify-center">{extraActions}</div>
        ) : null}
        <div className="mt-3 flex justify-center">{loginButton}</div>
      </div>
    </header>
  );
}
