/**
 * Canonical paths for the marketing navigation.
 *
 * Both the rendered nav (`src/nav/nav-menu.tsx`, `src/nav/mobile-nav-sheet.tsx`)
 * and the SiteNavigationElement JSON-LD read their hrefs from here, so a page can
 * never be declared in structured data without also being linked in the nav.
 */
export const MARKETING_NAV_PATHS = {
  olIct: "/programs/ol-ict",
  alIct: "/programs/al-ict",
  onlineZoom: "/programs/online-zoom",
  paperCenters: "/network/paper-centers",
  courses: "/courses",
  pastPapers: "/past-papers",
  blog: "/blog",
  team: "/ictf-team",
  founder: "/about/founder",
} as const;

/**
 * The crawlable destinations Google may promote as sitelinks, in the order we
 * consider them important. Homepage anchors (#about, #results, #faq, #contact)
 * are deliberately absent: they are fragments of `/`, not separate URLs, so they
 * can never become sitelinks and would only dilute the list.
 *
 * Names are intentionally short — Google prints the leading tokens of a
 * destination's label, so "Past Papers" reads better as a sitelink than
 * "Past Papers Network for O/L and A/L Students".
 */
export const MARKETING_SITE_NAV = [
  {
    path: MARKETING_NAV_PATHS.courses,
    name: "Courses",
    description: "All ICTF O/L and A/L ICT courses with live Zoom classes.",
  },
  {
    path: MARKETING_NAV_PATHS.olIct,
    name: "O/L ICT",
    description: "G.C.E. Ordinary Level ICT classes for Sri Lankan students.",
  },
  {
    path: MARKETING_NAV_PATHS.alIct,
    name: "A/L ICT",
    description: "G.C.E. Advanced Level ICT classes for Sri Lankan students.",
  },
  {
    path: MARKETING_NAV_PATHS.onlineZoom,
    name: "Online Zoom Classes",
    description: "Live online ICT classes taught over Zoom islandwide.",
  },
  {
    path: MARKETING_NAV_PATHS.pastPapers,
    name: "Past Papers",
    description: "Free G.C.E. O/L and A/L ICT past papers to preview and download.",
  },
  {
    path: MARKETING_NAV_PATHS.paperCenters,
    name: "Paper Centers",
    description: "The islandwide ICTF paper center network across Sri Lanka.",
  },
  {
    path: MARKETING_NAV_PATHS.blog,
    name: "Blog",
    description: "ICT exam tips, study guidance, and institute updates.",
  },
  {
    path: MARKETING_NAV_PATHS.team,
    name: "ICTF Team",
    description: "The instructors and academic staff who teach at ICTF.",
  },
  {
    path: MARKETING_NAV_PATHS.founder,
    name: "Founder",
    description: "Vithoosan Sivanathan, founder and lead ICT educator at ICTF.",
  },
] as const;

/** Hash links on sub-pages must point back to the home page sections. */
export function resolveMarketingHref(href: string, pathname: string) {
  if (href.startsWith("#") && pathname !== "/") {
    return `/${href}`;
  }
  return href;
}
