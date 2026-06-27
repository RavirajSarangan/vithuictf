/** Toggle public marketing pages. Disabled routes redirect to the marketing home. */
export const MARKETING_PAGE_ACCESS = {
  rankings: false,
} as const;

export function getBlockedMarketingRedirect(pathname: string): string | null {
  if (!MARKETING_PAGE_ACCESS.rankings) {
    const localeMatch = pathname.match(/^\/(ta|si)\/rankings\/?$/);
    if (localeMatch) {
      return `/${localeMatch[1]}`;
    }
    if (pathname === "/rankings" || pathname.startsWith("/rankings/")) {
      return "/";
    }
  }
  return null;
}
