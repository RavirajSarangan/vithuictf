import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { getComingSoonPath, isPortalRouteBlocked } from "@/lib/portal-access";
import { getBlockedMarketingRedirect } from "@/lib/marketing-page-access";
import {
  fetchSitePublicMode,
  getSiteGateRedirectPath,
  isSiteGatePublicExemptPath,
  isSiteGateWebhookPath,
  isSitePublicModeGated,
  shouldBypassSiteGate,
} from "@/lib/site-access";
import type { UserRole } from "@/types";

const studentRoutes: Record<string, UserRole[]> = {
  "/dashboard": ["student"],
  "/onboarding": ["student"],
  "/results": ["student"],
  "/resources": ["student"],
  "/calendar": ["student"],
  "/achievements": ["student"],
  "/leaderboard": ["student"],
  "/profile-card": ["student"],
  "/ai-assistant": ["student"],
  "/settings": ["student"],
};

const AUTH_SESSION_PREFIXES = [
  "/login",
  "/register",
  "/dashboard",
  "/onboarding",
  "/results",
  "/resources",
  "/calendar",
  "/achievements",
  "/leaderboard",
  "/profile-card",
  "/ai-assistant",
  "/settings",
  "/admin",
  "/parent",
];

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some((cookie) => cookie.name.includes("-auth-token"));
}

function needsAuthSession(pathname: string, request: NextRequest): boolean {
  if (AUTH_SESSION_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true;
  }
  return hasSupabaseAuthCookie(request);
}

function redirectForRole(role: UserRole, request: NextRequest): NextResponse {
  const comingSoon = getComingSoonPath(role);
  if (comingSoon) {
    return NextResponse.redirect(new URL(comingSoon, request.url));
  }
  if (role === "admin" || role === "teacher") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }
  if (role === "parent") {
    return NextResponse.redirect(new URL("/parent/dashboard", request.url));
  }
  return NextResponse.redirect(new URL("/dashboard", request.url));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const localePrefix = pathname.match(/^\/(ta|si)(\/|$)/)?.[1];

  if (isSiteGateWebhookPath(pathname)) {
    return NextResponse.next();
  }

  const blockedMarketing = getBlockedMarketingRedirect(pathname);
  if (blockedMarketing) {
    return NextResponse.redirect(new URL(blockedMarketing, request.url));
  }

  const siteMode = await fetchSitePublicMode();

  let response = NextResponse.next({ request });
  let role: UserRole | null = null;
  let session: { role: UserRole } | null = null;

  if (needsAuthSession(pathname, request)) {
    const result = await updateSession(request);
    response = result.supabaseResponse;
    role = (result.role as UserRole | null) ?? null;
    session = result.user && role ? { role } : null;
  }

  if (isSitePublicModeGated(siteMode) && !shouldBypassSiteGate(role)) {
    if (!isSiteGatePublicExemptPath(pathname, siteMode)) {
      const gatePath = getSiteGateRedirectPath(siteMode);
      return NextResponse.redirect(new URL(gatePath, request.url));
    }
  }

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  const blockedPortal = isPortalRouteBlocked(pathname);
  if (blockedPortal && !pathname.startsWith("/coming-soon")) {
    return NextResponse.redirect(new URL(blockedPortal, request.url));
  }

  if (isAuthPage && session) {
    return redirectForRole(session.role, request);
  }

  for (const [prefix, roles] of Object.entries(studentRoutes)) {
    if (pathname.startsWith(prefix)) {
      if (!session) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      if (!roles.includes(session.role)) {
        return redirectForRole(session.role, request);
      }
    }
  }

  if (pathname.startsWith("/parent")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (session.role !== "parent") {
      return redirectForRole(session.role, request);
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (session.role !== "admin" && session.role !== "teacher") {
      return redirectForRole(session.role, request);
    }
  }

  if (localePrefix === "ta" || localePrefix === "si") {
    response.cookies.set("icvf-marketing-locale", localePrefix, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
