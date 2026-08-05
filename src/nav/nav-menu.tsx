"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, GraduationCap, MapPin, Video } from "lucide-react";
import { useMemo, type ComponentProps, type ReactNode } from "react";
import { MarketingSectionLink } from "@/components/shared/marketing-section-link";
import { NavFreeDownloadBadge } from "@/components/shared/nav-free-download-badge";
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
import { MARKETING_NAV_PATHS } from "@/lib/marketing-nav";
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
  const passPapersActive = pathname === "/past-papers" || pathname.startsWith("/past-papers/");
  const ictfTeamActive = pathname === "/ictf-team" || pathname.startsWith("/ictf-team/");
  const coursesActive = pathname === "/courses" || pathname.startsWith("/courses/");

  const programLinks = useMarketingProgramLinks();

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
              href={MARKETING_NAV_PATHS.courses}
              className={cn(navLinkClass, coursesActive && "font-semibold text-white")}
              aria-current={coursesActive ? "page" : undefined}
            >
              {t("nav.courses")}
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              href={MARKETING_NAV_PATHS.team}
              className={cn(navLinkClass, ictfTeamActive && "font-semibold text-white")}
              aria-current={ictfTeamActive ? "page" : undefined}
            >
              ICTF Team
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              href={MARKETING_NAV_PATHS.pastPapers}
              className={cn(
                navLinkClass,
                "inline-flex items-center gap-1.5",
                passPapersActive && "font-semibold text-white"
              )}
              aria-current={passPapersActive ? "page" : undefined}
              aria-label={`${t("nav.passPapers")} — ${t("nav.passPapersFreeDownload")}`}
            >
              <span aria-hidden="true">{t("nav.passPapers")}</span>
              <NavFreeDownloadBadge />
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              href={MARKETING_NAV_PATHS.blog}
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
        href: MARKETING_NAV_PATHS.olIct,
        description: t("hero.liveZoom"),
        icon: BookOpen,
      },
      {
        title: "A/L ICT",
        href: MARKETING_NAV_PATHS.alIct,
        description: t("nav.institute"),
        icon: GraduationCap,
      },
      {
        title: "Online Zoom",
        href: MARKETING_NAV_PATHS.onlineZoom,
        description: t("hero.lmsPortal"),
        icon: Video,
      },
      {
        // Live, indexed page — must stay a real anchor so Googlebot can follow it.
        title: t("centers.paperCenters"),
        href: MARKETING_NAV_PATHS.paperCenters,
        description: t("centers.badge"),
        icon: MapPin,
      },
    ],
    [t]
  );
}
