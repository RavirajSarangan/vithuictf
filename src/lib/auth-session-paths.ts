/** Routes that require immediate client auth init (no idle deferral). */
export const IMMEDIATE_AUTH_PREFIXES = [
  "/login",
  "/register",
  "/dashboard",
  "/onboarding",
  "/results",
  "/resources",
  "/calendar",
  "/attendance",
  "/achievements",
  "/leaderboard",
  "/profile-card",
  "/ai-assistant",
  "/settings",
  "/admin",
  "/parent",
  "/staff",
  "/academics",
  "/paper-center",
] as const;

export function shouldDeferAuth(pathname: string): boolean {
  return !IMMEDIATE_AUTH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function needsAuthSession(pathname: string, hasAuthCookie: boolean): boolean {
  if (
    IMMEDIATE_AUTH_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  ) {
    return true;
  }
  return hasAuthCookie;
}
