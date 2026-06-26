"use client";

import Link from "next/link";
import * as React from "react";
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu";
import { ChevronDownIcon } from "lucide-react";

import { GridCard } from "@/components/ui/grid-card";
import { cn } from "@/lib/utils";

type NavItemType = {
  title: string;
  href: string;
  description?: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge?: string;
  disabled?: boolean;
};

function NavigationMenu({
  className,
  children,
  viewport = true,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Root> & {
  viewport?: boolean;
}) {
  return (
    <NavigationMenuPrimitive.Root
      data-slot="navigation-menu"
      data-viewport={viewport}
      className={cn(
        "group/navigation-menu relative flex max-w-max flex-1 items-center justify-center",
        className
      )}
      {...props}
    >
      {children}
      {viewport ? <NavigationMenuViewport /> : null}
    </NavigationMenuPrimitive.Root>
  );
}

function NavigationMenuList({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.List>) {
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={cn(
        "group flex flex-1 list-none items-center justify-center gap-1",
        className
      )}
      {...props}
    />
  );
}

function NavigationMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Item>) {
  return (
    <NavigationMenuPrimitive.Item
      data-slot="navigation-menu-item"
      className={cn("relative", className)}
      {...props}
    />
  );
}

function NavigationMenuTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Trigger>) {
  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(
        "group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-1 text-sm font-medium transition-[color,box-shadow] outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=open]:bg-accent/50 data-[state=open]:text-accent-foreground data-[state=open]:hover:bg-accent data-[state=open]:focus:bg-accent",
        className
      )}
      {...props}
    >
      {children}{" "}
      <ChevronDownIcon
        className="relative top-px ml-1 size-3 transition duration-300 group-data-[state=open]:rotate-180"
        aria-hidden="true"
      />
    </NavigationMenuPrimitive.Trigger>
  );
}

function NavigationMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Content>) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn(
        "top-0 left-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto",
        "group-data-[viewport=false]/navigation-menu:top-full group-data-[viewport=false]/navigation-menu:mt-1.5 group-data-[viewport=false]/navigation-menu:overflow-hidden group-data-[viewport=false]/navigation-menu:rounded-md group-data-[viewport=false]/navigation-menu:border group-data-[viewport=false]/navigation-menu:bg-background/80 group-data-[viewport=false]/navigation-menu:text-foreground group-data-[viewport=false]/navigation-menu:shadow group-data-[viewport=false]/navigation-menu:duration-300 group-data-[viewport=false]/navigation-menu:data-[state=closed]:animate-out group-data-[viewport=false]/navigation-menu:data-[state=closed]:fade-out-0 group-data-[viewport=false]/navigation-menu:data-[state=closed]:zoom-out-95 group-data-[viewport=false]/navigation-menu:data-[state=open]:animate-in group-data-[viewport=false]/navigation-menu:data-[state=open]:fade-in-0 group-data-[viewport=false]/navigation-menu:data-[state=open]:zoom-in-95 **:data-[slot=navigation-menu-link]:focus:ring-0 **:data-[slot=navigation-menu-link]:focus:outline-none",
        className
      )}
      {...props}
    />
  );
}

function NavigationMenuViewport({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Viewport>) {
  return (
    <div className="absolute top-full left-0 isolate z-50 flex justify-center">
      <NavigationMenuPrimitive.Viewport
        data-slot="navigation-menu-viewport"
        className={cn(
          "relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full origin-top-center overflow-hidden rounded-md border bg-background/95 text-popover-foreground shadow backdrop-blur-xl data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:zoom-in-90 supports-[backdrop-filter]:bg-background/60 md:w-[var(--radix-navigation-menu-viewport-width)]",
          className
        )}
        {...props}
      />
    </div>
  );
}

function NavigationMenuLink({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Link>) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      className={cn(
        "flex flex-col justify-center gap-1 rounded-sm px-4 py-1 text-sm transition-all outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 data-[active=true]:bg-accent/50 data-[active=true]:text-accent-foreground data-[active=true]:hover:bg-accent data-[active=true]:focus:bg-accent [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

function NavigationMenuIndicator({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Indicator>) {
  return (
    <NavigationMenuPrimitive.Indicator
      data-slot="navigation-menu-indicator"
      className={cn(
        "top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:animate-in data-[state=visible]:fade-in",
        className
      )}
      {...props}
    >
      <div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md" />
    </NavigationMenuPrimitive.Indicator>
  );
}

function NavGridCard({
  link,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  link: NavItemType;
}) {
  const card = (
    <GridCard
      className={cn(
        "relative h-full min-h-[7.5rem]",
        link.disabled && "cursor-not-allowed opacity-75"
      )}
    >
      {link.badge ? (
        <span className="absolute top-3 right-3 z-10 rounded-full border border-icvf-accent/30 bg-icvf-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-icvf-accent">
          {link.badge}
        </span>
      ) : null}
      {link.icon ? (
        <link.icon className="relative size-5 text-foreground/80" />
      ) : null}
      <div className="relative">
        <span className="text-sm font-medium text-foreground/80">{link.title}</span>
        {link.description ? (
          <p className="mt-2 text-xs text-muted-foreground">{link.description}</p>
        ) : null}
      </div>
    </GridCard>
  );

  if (link.disabled) {
    return (
      <div
        className={cn("block h-full outline-none", className)}
        aria-disabled="true"
        role="link"
      >
        {card}
      </div>
    );
  }

  return (
    <NavigationMenuPrimitive.Link asChild>
      <Link href={link.href} className={cn("block h-full outline-none", className)} {...props}>
        {card}
      </Link>
    </NavigationMenuPrimitive.Link>
  );
}

function NavItemMobile({
  item,
  className,
  tone = "default",
  ...props
}: React.ComponentProps<"a"> & {
  item: NavItemType;
  tone?: "default" | "marketing";
}) {
  const isMarketing = tone === "marketing";

  const badge = item.badge ? (
    isMarketing ? (
      <span className="inline-flex shrink-0 rounded-full border border-icvf-accent/30 bg-icvf-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-icvf-accent">
        {item.badge}
      </span>
    ) : (
      <span className="absolute -top-1.5 -right-1 rounded-md bg-icvf-accent px-1 py-px text-[8px] font-bold uppercase text-icvf-navy-dark">
        {item.badge}
      </span>
    )
  ) : null;

  const content = (
    <>
      <div
        className={cn(
          "relative flex size-10 shrink-0 items-center justify-center",
          isMarketing
            ? "rounded-xl border border-white/12 bg-white/[0.06]"
            : "rounded-lg border bg-muted/20"
        )}
      >
        {item.icon ? (
          <item.icon className={cn("size-4", isMarketing ? "text-white/70" : undefined)} />
        ) : null}
        {!isMarketing ? badge : null}
      </div>
      <div className="flex min-h-10 min-w-0 flex-1 flex-col justify-center">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <p className={cn("text-sm", isMarketing && "font-medium text-white")}>{item.title}</p>
          {isMarketing ? badge : null}
        </div>
        {item.description ? (
          <span
            className={cn(
              "line-clamp-1 text-xs leading-snug",
              isMarketing ? "text-white/50" : "text-muted-foreground"
            )}
          >
            {item.description}
          </span>
        ) : null}
      </div>
    </>
  );

  const sharedClassName = cn(
    isMarketing
      ? "group relative flex gap-3 rounded-xl px-2.5 py-2.5 text-sm no-underline transition-colors outline-none hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-white/20"
      : "group relative flex gap-x-2 gap-y-1 rounded-sm p-2 text-sm transition-all outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 data-[active=true]:bg-accent/50 data-[active=true]:text-accent-foreground data-[active=true]:hover:bg-accent data-[active=true]:focus:bg-accent [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
    item.disabled &&
      (isMarketing
        ? "cursor-not-allowed opacity-70 hover:bg-transparent"
        : "cursor-not-allowed opacity-75 hover:bg-transparent"),
    className
  );

  if (item.disabled) {
    return (
      <div className={sharedClassName} aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <a className={sharedClassName} {...props}>
      {content}
    </a>
  );
}

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  NavGridCard,
  NavItemMobile,
  type NavItemType,
};
