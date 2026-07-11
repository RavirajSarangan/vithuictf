import { revalidatePath } from "next/cache";

/** Revalidate without failing the mutation that triggered it. */
export function safeRevalidatePath(path: string, type?: "page" | "layout"): void {
  try {
    if (type) {
      revalidatePath(path, type);
    } else {
      revalidatePath(path);
    }
  } catch (error) {
    console.warn(`[revalidate] Skipped ${path}:`, error);
  }
}

export function safeRevalidatePaths(paths: readonly string[]): void {
  for (const path of paths) {
    safeRevalidatePath(path);
  }
}
