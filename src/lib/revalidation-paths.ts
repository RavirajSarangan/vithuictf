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

export function revalidateSitePublicPaths() {
  revalidateMarketingPaths();
  revalidatePath("/admin/home");
  revalidatePath("/parent");
  revalidatePath("/verify");
}
