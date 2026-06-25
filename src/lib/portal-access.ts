import type { UserRole } from "@/types";

/** Toggle portal availability per role. */
export const PORTAL_ACCESS = {
  student: true,
  parent: false,
  teacher: false,
  admin: true,
} as const;

export function getComingSoonPath(role: UserRole): string | null {
  if (role === "parent" && !PORTAL_ACCESS.parent) return "/coming-soon/parent";
  if (role === "teacher" && !PORTAL_ACCESS.teacher) return "/coming-soon/teacher";
  if (role === "admin" && !PORTAL_ACCESS.admin) return "/coming-soon/admin";
  return null;
}

export function isPortalRouteBlocked(pathname: string): string | null {
  if (pathname.startsWith("/parent") && !PORTAL_ACCESS.parent) return "/coming-soon/parent";
  if (
    pathname.startsWith("/admin") &&
    !PORTAL_ACCESS.admin &&
    !PORTAL_ACCESS.teacher
  ) {
    return "/coming-soon/admin";
  }
  return null;
}
