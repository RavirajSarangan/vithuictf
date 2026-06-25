"use client";

import { PortalShell } from "@/components/layout/portal-shell";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";
import { AuthLayoutProvider } from "@/providers/auth-layout-provider";
import { studentNav } from "@/lib/navigation";

export function StudentLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <AuthLayoutProvider>
      <PortalShell navItems={studentNav} variant="student">
        <OnboardingGate>{children}</OnboardingGate>
      </PortalShell>
    </AuthLayoutProvider>
  );
}
