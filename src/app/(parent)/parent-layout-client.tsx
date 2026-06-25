"use client";

import { PortalShell } from "@/components/layout/portal-shell";
import { AuthLayoutProvider } from "@/providers/auth-layout-provider";
import { parentNav } from "@/lib/navigation";

export function ParentLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <AuthLayoutProvider>
      <PortalShell navItems={parentNav} variant="parent">
        {children}
      </PortalShell>
    </AuthLayoutProvider>
  );
}
