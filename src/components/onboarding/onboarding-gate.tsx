"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useStudentOnboarding } from "@/hooks/use-student-onboarding";
import { ROUTE_TO_ONBOARDING_STEP } from "@/lib/onboarding/student-steps";

export const ONBOARDING_TOUR_KEY = "icvf_onboarding_tour";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { isComplete, hydrated, markStep } = useStudentOnboarding();

  const isOnboardingRoute = pathname === "/onboarding";
  const stepForRoute = ROUTE_TO_ONBOARDING_STEP[pathname];

  useEffect(() => {
    if (stepForRoute && hydrated && !isComplete) {
      void markStep(stepForRoute, true);
    }
  }, [stepForRoute, hydrated, isComplete, markStep]);

  useEffect(() => {
    if (loading || !user || user.role !== "student" || !hydrated) return;

    const touring = sessionStorage.getItem(ONBOARDING_TOUR_KEY) === "1";

    if (!isComplete && !isOnboardingRoute && !touring) {
      router.replace("/onboarding");
      return;
    }

    if (isComplete && isOnboardingRoute) {
      router.replace("/dashboard");
    }
  }, [loading, user, hydrated, isComplete, isOnboardingRoute, router, pathname]);

  return <>{children}</>;
}
