import { safeRevalidatePath } from "@/lib/safe-revalidate";

/** Student-facing routes that should refresh after admin content mutations. */
export function revalidateStudentPortalPaths() {
  const paths = [
    "/dashboard",
    "/results",
    "/resources",
    "/calendar",
    "/slides",
    "/achievements",
    "/leaderboard",
    "/profile-card",
    "/ai-assistant",
    "/settings",
  ] as const;

  for (const path of paths) {
    safeRevalidatePath(path);
  }
}

/** Admin course catalog mutations. */
export function revalidateCoursePaths() {
  safeRevalidatePath("/admin/courses");
  safeRevalidatePath("/");
  revalidateStudentPortalPaths();
}

/** Marketing pages that embed platform-managed content. */
export function revalidateMarketingPaths() {
  const paths = [
    "/",
    "/ta",
    "/si",
    "/blog",
    "/rankings",
    "/network",
    "/coming-soon",
    "/maintenance",
    "/login",
    "/register",
  ] as const;

  for (const path of paths) {
    safeRevalidatePath(path);
  }
}

/** Blog listing and post detail pages. */
export function revalidateBlogPaths(slugs: string[] = []) {
  safeRevalidatePath("/blog");
  for (const slug of slugs) {
    safeRevalidatePath(`/blog/${slug}`);
  }
}

export function revalidateSitePublicPaths() {
  revalidateMarketingPaths();
  safeRevalidatePath("/admin/home");
  safeRevalidatePath("/parent");
  safeRevalidatePath("/verify");
}
