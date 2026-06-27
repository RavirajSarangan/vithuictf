export const MARKETING_NAV_LINKS = [
  { href: "/programs/ol-ict", labelKey: "nav.programs" as const },
  { href: "/#about", labelKey: "nav.about" as const },
  { href: "/blog", labelKey: "nav.blog" as const },
  { href: "/#results", labelKey: "nav.results" as const },
  { href: "/#faq", labelKey: "nav.faq" as const },
  { href: "/#contact", labelKey: "nav.contact" as const },
] as const;

/** Hash links on sub-pages must point back to the home page sections. */
export function resolveMarketingHref(href: string, pathname: string) {
  if (href.startsWith("#") && pathname !== "/") {
    return `/${href}`;
  }
  return href;
}
