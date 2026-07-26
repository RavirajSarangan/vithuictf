import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { needsAuthSession as shouldRefreshAuthSession } from "@/lib/auth-session-paths";
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
import { isAdminOnlyRoute, isSuperAdminOnlyRoute } from "@/lib/admin-access";
import { ACADEMICS_FEATURE_ROUTES } from "@/lib/staff-feature-routes";
import { FACULTY_FEATURE_ROUTES } from "@/lib/faculty-feature-routes";
import type { UserRole } from "@/types";

const studentRoutes: Record<string, UserRole[]> = {
  "/dashboard": ["student"],
  "/onboarding": ["student"],
  "/results": ["student"],
  "/resources": ["student"],
  "/calendar": ["student"],
  "/attendance": ["student"],
  "/payments": ["student"],
  "/announcements": ["student"],
  "/assignments": ["student"],
  "/quizzes": ["student"],
  "/exams": ["student"],
  "/achievements": ["student"],
  "/leaderboard": ["student"],
  "/profile-card": ["student"],
  "/ai-assistant": ["student"],
  "/settings": ["student"],
};

const AUTH_EXCLUDED_MATCHER =
  "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)";

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some((cookie) => cookie.name.includes("-auth-token"));
}

function needsAuthSession(pathname: string, request: NextRequest): boolean {
  return shouldRefreshAuthSession(pathname, hasSupabaseAuthCookie(request));
}

function redirectForRole(role: UserRole, request: NextRequest): NextResponse {
  const comingSoon = getComingSoonPath(role);
  if (comingSoon) {
    return NextResponse.redirect(new URL(comingSoon, request.url));
  }
  if (role === "teacher") {
    return NextResponse.redirect(new URL("/academics/dashboard", request.url));
  }
  if (role === "admin" || role === "super_admin") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }
  if (role === "content_manager") {
    return NextResponse.redirect(new URL("/staff/tracking", request.url));
  }
  if (role === "paper_center_staff") {
    return NextResponse.redirect(new URL("/paper-center/dashboard", request.url));
  }
  if (role === "faculty_staff") {
    return NextResponse.redirect(new URL("/faculty/dashboard", request.url));
  }
  if (role === "parent") {
    return NextResponse.redirect(new URL("/parent/dashboard", request.url));
  }
  return NextResponse.redirect(new URL("/dashboard", request.url));
}

function loginPathForRoute(pathname: string): string {
  if (pathname.startsWith("/admin")) return "/login/admin";
  if (pathname.startsWith("/academics")) return "/login/staff";
  if (pathname.startsWith("/staff")) return "/login/social-tracking";
  if (pathname.startsWith("/paper-center")) return "/login/paper-center";
  if (pathname.startsWith("/faculty")) return "/login/faculty";
  if (pathname.startsWith("/parent")) return "/login";
  return "/login";
}

function nextWithPathname(request: NextRequest, pathname: string): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

const CANONICAL_WWW_HOST = "www.ictf.lk";
const APEX_HOSTS = new Set(["ictf.lk"]);

function canonicalHostRedirect(request: NextRequest): NextResponse | null {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase();
  if (!host || !APEX_HOSTS.has(host)) return null;

  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.host = CANONICAL_WWW_HOST;
  return NextResponse.redirect(url, 308);
}

export async function proxy(request: NextRequest) {
  const hostRedirect = canonicalHostRedirect(request);
  if (hostRedirect) return hostRedirect;

  const { pathname } = request.nextUrl;
  const localePrefix = pathname.match(/^\/(ta|si)(\/|$)/)?.[1];

  if (isSiteGateWebhookPath(pathname)) {
    return NextResponse.next();
  }

  // API routes bypass proxy auth — each handler must enforce its own checks.
  if (pathname.startsWith("/api/")) {
    return nextWithPathname(request, pathname);
  }

  const blockedMarketing = getBlockedMarketingRedirect(pathname);
  if (blockedMarketing) {
    return NextResponse.redirect(new URL(blockedMarketing, request.url));
  }

  const siteMode = await fetchSitePublicMode();

  let response = nextWithPathname(request, pathname);
  let role: UserRole | null = null;
  let session: { role: UserRole } | null = null;
  let sessionReplaced = false;
  let disabledFeatures: string[] = [];

  if (needsAuthSession(pathname, request)) {
    const result = await updateSession(request, pathname);
    response = result.supabaseResponse;
    role = (result.role as UserRole | null) ?? null;
    session = result.user && role ? { role } : null;
    sessionReplaced = result.sessionReplaced;
    disabledFeatures = result.disabledFeatures;
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
    // /results/check is a public, unauthenticated lookup page — it must not
    // inherit the logged-in-student-only protection applied to /results.
    if (prefix === "/results" && pathname.startsWith("/results/check")) continue;
    if (pathname.startsWith(prefix)) {
      if (!session) {
        const loginUrl = new URL("/login", request.url);
        if (sessionReplaced) {
          loginUrl.searchParams.set("reason", "session-replaced");
        }
        return NextResponse.redirect(loginUrl);
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
      return NextResponse.redirect(new URL(loginPathForRoute(pathname), request.url));
    }
    if (
      session.role !== "admin" &&
      session.role !== "super_admin" &&
      session.role !== "teacher"
    ) {
      return redirectForRole(session.role, request);
    }
    if (session.role === "teacher" && isAdminOnlyRoute(pathname)) {
      return NextResponse.redirect(new URL("/academics/dashboard", request.url));
    }
    if (session.role !== "super_admin" && isSuperAdminOnlyRoute(pathname)) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  if (pathname.startsWith("/academics")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login/staff", request.url));
    }
    if (!["super_admin", "admin", "teacher"].includes(session.role)) {
      return redirectForRole(session.role, request);
    }
    // Per-teacher feature toggles — admin/super_admin always bypass.
    if (session.role === "teacher" && disabledFeatures.length) {
      const disabledFeature = ACADEMICS_FEATURE_ROUTES.find(
        ({ prefix, featureKey }) => pathname.startsWith(prefix) && disabledFeatures.includes(featureKey)
      );
      if (disabledFeature) {
        return NextResponse.redirect(new URL("/academics/dashboard", request.url));
      }
    }
  }

  if (pathname.startsWith("/staff")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login/social-tracking", request.url));
    }
    if (session.role !== "content_manager") {
      return redirectForRole(session.role, request);
    }
  }

  if (pathname.startsWith("/paper-center")) {
    if (pathname === "/paper-center" || pathname === "/paper-center/") {
      return NextResponse.redirect(new URL("/paper-center/dashboard", request.url));
    }
    if (!session) {
      return NextResponse.redirect(new URL("/login/paper-center", request.url));
    }
    if (session.role !== "paper_center_staff") {
      return redirectForRole(session.role, request);
    }
  }

  if (pathname.startsWith("/faculty")) {
    if (pathname === "/faculty" || pathname === "/faculty/") {
      return NextResponse.redirect(new URL("/faculty/dashboard", request.url));
    }
    if (!session) {
      return NextResponse.redirect(new URL("/login/faculty", request.url));
    }
    if (!["super_admin", "admin", "faculty_staff"].includes(session.role)) {
      return redirectForRole(session.role, request);
    }
    // Per-faculty-staff feature toggles — admin/super_admin always bypass.
    if (session.role === "faculty_staff" && disabledFeatures.length) {
      const disabledFeature = FACULTY_FEATURE_ROUTES.find(
        ({ prefix, featureKey }) => pathname.startsWith(prefix) && disabledFeatures.includes(featureKey)
      );
      if (disabledFeature) {
        return NextResponse.redirect(new URL("/faculty/dashboard", request.url));
      }
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
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
