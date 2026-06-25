"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/shared/brand-logo";
import { BRAND } from "@/lib/constants";
import { useAuth } from "@/providers/auth-provider";
import { NotificationCenter } from "@/components/layout/notification-center";
import { CommandPalette } from "@/components/layout/command-palette";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SecurityComplianceBadges } from "@/components/shared/security-compliance-badges";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface PortalShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
  variant?: "student" | "parent" | "admin";
  title?: string;
}

function getMobileNavItems(variant: "student" | "parent" | "admin", navItems: NavItem[]) {
  const preferred =
    variant === "student"
      ? ["/dashboard", "/calendar", "/results", "/resources"]
      : variant === "parent"
        ? ["/parent/dashboard", "/parent/calendar", "/parent/performance", "/parent/notifications"]
        : ["/admin/dashboard", "/admin/calendar", "/admin/students", "/admin/courses"];

  return preferred
    .map((href) => navItems.find((item) => item.href === href))
    .filter((item): item is NavItem => Boolean(item));
}

function getInitials(name?: string | null): string {
  if (!name?.trim()) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function PortalSidebar({
  navItems,
  variant,
}: {
  navItems: NavItem[];
  variant: "student" | "parent" | "admin";
}) {
  const pathname = usePathname();
  const { signOut, user } = useAuth();
  const isAdmin = variant === "admin";
  const brandHref =
    variant === "student" ? "/" : variant === "parent" ? "/parent/dashboard" : "/admin/dashboard";

  return (
    <Sidebar
      className={cn(
        "border-r",
        isAdmin
          ? "border-white/10 bg-icvf-navy-dark [&_[data-sidebar=sidebar]]:bg-icvf-navy-dark"
          : "border-white/10 bg-icvf-navy [&_[data-sidebar=sidebar]]:bg-icvf-navy"
      )}
    >
      <SidebarHeader className="border-b border-white/10 px-4 py-5">
        <Link href={brandHref} className="inline-flex" aria-label={BRAND.name}>
          <BrandLogo size="lg" light />
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarMenu className="gap-1.5">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <SidebarMenuItem key={item.href} className="relative">
                {active ? (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 z-10 h-7 w-1 -translate-y-1/2 rounded-r-full bg-icvf-accent shadow-sm transition-all duration-300"
                  />
                ) : null}
                <SidebarMenuButton
                  isActive={active}
                  size="lg"
                  render={<Link href={item.href} />}
                  className={cn(
                    "h-11 rounded-xl px-3.5 font-medium transition-all duration-200",
                    "text-white/75 hover:bg-white/10 hover:text-white",
                    "data-active:bg-white data-active:text-icvf-navy data-active:shadow-md",
                    "data-active:hover:bg-white data-active:hover:text-icvf-navy",
                    active && "bg-white text-icvf-navy shadow-md hover:bg-white hover:text-icvf-navy"
                  )}
                >
                  <item.icon className={cn("size-[18px]", active && "text-icvf-navy")} />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-icvf-accent text-xs font-bold text-white">
            {getInitials(user?.displayName)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{user?.displayName}</p>
            <p className="truncate text-xs text-white/50">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="h-11 w-full justify-start rounded-xl border-white/20 bg-transparent text-white/85 hover:bg-white/10 hover:text-white"
          onClick={() => signOut()}
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

function MobileBottomNav({
  items,
  pathname,
  isAdmin,
}: {
  items: NavItem[];
  pathname: string;
  isAdmin: boolean;
}) {
  const activeIndex = useMemo(
    () =>
      Math.max(
        0,
        items.findIndex(
          (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
        )
      ),
    [items, pathname]
  );

  const tabWidth = items.length > 0 ? 100 / items.length : 100;

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t md:hidden",
        isAdmin ? "border-white/10 bg-icvf-navy-dark" : "border-icvf-border bg-white"
      )}
    >
      <div
        className="absolute top-0 h-0.5 bg-icvf-accent transition-all duration-300 ease-out"
        style={{
          width: `${tabWidth}%`,
          left: `${activeIndex * tabWidth}%`,
        }}
      />
      <div className="flex px-1 pb-[env(safe-area-inset-bottom,0px)] pt-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold transition-colors duration-200",
                active
                  ? isAdmin
                    ? "bg-white/10 text-icvf-accent"
                    : "bg-icvf-navy/8 text-icvf-navy"
                  : isAdmin
                    ? "text-white/55"
                    : "text-icvf-text-light"
              )}
            >
              <item.icon className={cn("size-5", active && !isAdmin && "text-icvf-navy")} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function PortalShell({ children, navItems, variant = "student", title }: PortalShellProps) {
  const pathname = usePathname();
  const isAdmin = variant === "admin";
  const mobileNavItems = getMobileNavItems(variant, navItems);

  const pageTitle = useMemo(() => {
    if (title) return title;
    const match = navItems.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
    );
    return match?.label ?? "Dashboard";
  }, [title, navItems, pathname]);

  return (
    <SidebarProvider>
      <div className={cn("flex min-h-screen w-full", isAdmin ? "bg-icvf-navy-dark" : "bg-background")}>
        <PortalSidebar navItems={navItems} variant={variant} />
        <SidebarInset className={cn("flex flex-1 flex-col", isAdmin ? "bg-icvf-navy-dark" : "bg-background")}>
          <header
            className={cn(
              "sticky top-0 z-30 flex h-16 items-center justify-between border-b px-4 md:px-6",
              isAdmin
                ? "border-white/10 bg-icvf-navy-dark/95 backdrop-blur"
                : "border-icvf-border bg-white/95 backdrop-blur"
            )}
          >
            <div className="flex items-center gap-2">
              <SidebarTrigger
                className={cn(
                  "size-10 rounded-xl border shadow-sm transition-colors",
                  isAdmin
                    ? "border-white/15 bg-white/5 text-white hover:bg-white/10"
                    : "border-icvf-border bg-icvf-surface text-icvf-navy hover:bg-icvf-navy/5"
                )}
              />
              <h1 className={cn("text-lg font-semibold", isAdmin ? "text-white" : "text-icvf-navy")}>
                {pageTitle}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <CommandPalette variant={variant} />
              <NotificationCenter />
              <ThemeToggle />
            </div>
          </header>
          <main
            className={cn(
              "min-w-0 flex-1 overflow-x-hidden p-4 pb-28 md:p-6 md:pb-6",
              isAdmin ? "text-white" : ""
            )}
          >
            {children}
            {variant === "student" ? (
              <SecurityComplianceBadges variant="portal" className="mt-10" />
            ) : null}
          </main>
        </SidebarInset>
      </div>

      <MobileBottomNav items={mobileNavItems} pathname={pathname} isAdmin={isAdmin} />
    </SidebarProvider>
  );
}
