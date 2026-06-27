"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, GraduationCap, MapPin, Video } from "lucide-react";
import { useMemo, type ComponentProps, type ReactNode } from "react";
import { MarketingSectionLink } from "@/components/shared/marketing-section-link";
import {
  NavGridCard,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  type NavItemType,
} from "@/components/ui/navigation-menu";
import { useMarketingText } from "@/hooks/use-marketing-text";
import { cn } from "@/lib/utils";

const programsTriggerClass =
  "marketing-nav-link whitespace-nowrap inline-flex h-auto w-max items-center gap-1 rounded-none bg-transparent px-0 py-0 text-[0.8rem] font-medium text-white/55 shadow-none outline-none hover:bg-transparent hover:text-white focus:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:outline-none data-[state=open]:bg-transparent data-[state=open]:text-white xl:text-sm";

const navLinkClass =
  "marketing-nav-link whitespace-nowrap text-[0.8rem] font-medium text-white/55 no-underline transition-colors hover:text-white xl:text-sm";

function MarketingSectionNavLink({
  hash,
  children,
}: {
  hash: string;
  children: ReactNode;
}) {
  return (
    <MarketingSectionLink hash={hash} className={navLinkClass}>
      {children}
    </MarketingSectionLink>
  );
}

export function NavMenu(props: ComponentProps<typeof NavigationMenu>) {
  const { t } = useMarketingText();
  const pathname = usePathname();
  const blogActive = pathname === "/blog" || pathname.startsWith("/blog/");

  const programLinks = useMemo<NavItemType[]>(
    () => [
      {
        title: "O/L ICT",
        href: "/programs/ol-ict",
        description: t("hero.liveZoom"),
        icon: BookOpen,
      },
      {
        title: "A/L ICT",
        href: "/programs/al-ict",
        description: t("nav.institute"),
        icon: GraduationCap,
      },
      {
        title: "Online Zoom",
        href: "/programs/online-zoom",
        description: t("hero.lmsPortal"),
        icon: Video,
      },
      {
        title: t("centers.paperCenters"),
        href: "/network/paper-centers",
        description: t("centers.badge"),
        icon: MapPin,
        badge: t("marketing.comingSoon.title"),
        disabled: true,
      },
    ],
    [t]
  );

  return (
    <NavigationMenu viewport={false} {...props}>
      <NavigationMenuList className="flex flex-nowrap items-center gap-1.5 lg:gap-2 xl:gap-3.5">
        <NavigationMenuItem>
          <NavigationMenuTrigger variant="ghost" className={programsTriggerClass}>
            {t("nav.programs")}
          </NavigationMenuTrigger>
          <NavigationMenuContent className="marketing-nav-dropdown !absolute top-full left-0 mt-2 w-auto !p-0">
            <ul className="grid w-[38rem] gap-3 p-4 md:grid-cols-2">
              {programLinks.map((link) => (
                <li key={link.href}>
                  <NavGridCard link={link} />
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <MarketingSectionNavLink hash="#about">{t("nav.about")}</MarketingSectionNavLink>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              href="/blog"
              className={cn(navLinkClass, blogActive && "text-white")}
              aria-current={blogActive ? "page" : undefined}
            >
              {t("nav.blog")}
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <MarketingSectionNavLink hash="#results">{t("nav.results")}</MarketingSectionNavLink>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <MarketingSectionNavLink hash="#faq">{t("nav.faq")}</MarketingSectionNavLink>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <MarketingSectionNavLink hash="#contact">{t("nav.contact")}</MarketingSectionNavLink>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export function useMarketingProgramLinks() {
  const { t } = useMarketingText();

  return useMemo<NavItemType[]>(
    () => [
      {
        title: "O/L ICT",
        href: "/programs/ol-ict",
        description: t("hero.liveZoom"),
        icon: BookOpen,
      },
      {
        title: "A/L ICT",
        href: "/programs/al-ict",
        description: t("nav.institute"),
        icon: GraduationCap,
      },
      {
        title: "Online Zoom",
        href: "/programs/online-zoom",
        description: t("hero.lmsPortal"),
        icon: Video,
      },
      {
        title: t("centers.paperCenters"),
        href: "/network/paper-centers",
        description: t("centers.badge"),
        icon: MapPin,
        badge: t("marketing.comingSoon.title"),
        disabled: true,
      },
    ],
    [t]
  );
}
