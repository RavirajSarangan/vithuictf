"use client";

import { usePathname } from "next/navigation";
import { AuthProvider } from "@/providers/auth-provider";
import { shouldDeferAuth } from "@/lib/auth-session-paths";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const deferred = shouldDeferAuth(pathname);

  return <AuthProvider deferred={deferred}>{children}</AuthProvider>;
}
