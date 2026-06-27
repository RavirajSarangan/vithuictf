import { revalidatePath } from "next/cache";

/** Student-facing routes that should refresh after admin content mutations. */
export function revalidateStudentPortalPaths() {
  const paths = [
    "/dashboard",
    "/results",
    "/resources",
    "/calendar",
    "/achievements",
    "/leaderboard",
    "/profile-card",
    "/ai-assistant",
    "/settings",
  ] as const;

  for (const path of paths) {
    revalidatePath(path);
  }
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
    revalidatePath(path);
  }
}

/** Blog listing and post detail pages. */
export function revalidateBlogPaths(slugs: string[] = []) {
  revalidatePath("/blog");
  for (const slug of slugs) {
    revalidatePath(`/blog/${slug}`);
  }
}

export function revalidateSitePublicPaths() {
  revalidateMarketingPaths();
  revalidatePath("/admin/home");
  revalidatePath("/parent");
  revalidatePath("/verify");
}
