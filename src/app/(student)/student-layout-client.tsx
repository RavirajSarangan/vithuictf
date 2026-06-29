"use client";

import { PortalAuthGate } from "@/components/auth/portal-auth-gate";
import { PortalShell } from "@/components/layout/portal-shell";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";
import { RegistrationStatusGate } from "@/components/auth/registration-status-gate";
import { StudentCourseSwitcher } from "@/components/student/student-course-switcher";
import { StudentCourseProvider } from "@/contexts/student-course-context";
import { studentNav } from "@/lib/navigation";

export function StudentLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <StudentCourseProvider>
      <PortalShell
        navItems={studentNav}
        variant="student"
        headerSlot={<StudentCourseSwitcher />}
      >
        <PortalAuthGate allowedRoles={["student"]} loginHref="/login">
          <RegistrationStatusGate>
            <OnboardingGate>{children}</OnboardingGate>
          </RegistrationStatusGate>
        </PortalAuthGate>
      </PortalShell>
    </StudentCourseProvider>
  );
}
