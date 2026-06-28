import type { UserRole } from "@/types";

/** Toggle portal availability per role. */
export const PORTAL_ACCESS = {
  student: true,
  parent: false,
  teacher: true,
  admin: true,
  super_admin: true,
  content_manager: true,
  paper_center_staff: true,
} as const;

export function getComingSoonPath(role: UserRole): string | null {
  if (role === "parent" && !PORTAL_ACCESS.parent) return "/coming-soon/parent";
  if (role === "teacher" && !PORTAL_ACCESS.teacher) return "/coming-soon/staff";
  if (role === "admin" && !PORTAL_ACCESS.admin) return "/coming-soon/admin";
  if (role === "super_admin" && !PORTAL_ACCESS.super_admin) return "/coming-soon/admin";
  if (role === "content_manager" && !PORTAL_ACCESS.content_manager) return "/coming-soon/staff";
  if (role === "paper_center_staff" && !PORTAL_ACCESS.paper_center_staff) return "/coming-soon/staff";
  return null;
}

export function isPortalRouteBlocked(pathname: string): string | null {
  if (pathname.startsWith("/parent") && !PORTAL_ACCESS.parent) return "/coming-soon/parent";
  if (pathname.startsWith("/staff") && !PORTAL_ACCESS.content_manager) return "/coming-soon/staff";
  if (pathname.startsWith("/paper-center") && !PORTAL_ACCESS.paper_center_staff) {
    return "/coming-soon/staff";
  }
  if (
    (pathname.startsWith("/admin") || pathname.startsWith("/academics")) &&
    !PORTAL_ACCESS.admin &&
    !PORTAL_ACCESS.teacher &&
    !PORTAL_ACCESS.super_admin
  ) {
    return "/coming-soon/admin";
  }
  return null;
}
