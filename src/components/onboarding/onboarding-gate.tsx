"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { StudentPageLoading } from "@/components/student/portal/student-portal-states";
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

  const touring =
    typeof window !== "undefined" && sessionStorage.getItem(ONBOARDING_TOUR_KEY) === "1";

  const pendingOnboardingRedirect =
    !loading &&
    !!user &&
    user.role === "student" &&
    hydrated &&
    !isComplete &&
    !isOnboardingRoute &&
    !touring;

  const pendingDashboardRedirect =
    !loading && !!user && user.role === "student" && hydrated && isComplete && isOnboardingRoute;

  useEffect(() => {
    if (stepForRoute && hydrated && !isComplete) {
      void markStep(stepForRoute, true);
    }
  }, [stepForRoute, hydrated, isComplete, markStep]);

  useEffect(() => {
    if (pendingOnboardingRedirect) {
      router.replace("/onboarding");
      return;
    }

    if (pendingDashboardRedirect) {
      router.replace("/dashboard");
    }
  }, [pendingOnboardingRedirect, pendingDashboardRedirect, router]);

  if (pendingOnboardingRedirect || pendingDashboardRedirect) {
    return <StudentPageLoading rows={2} />;
  }

  return <>{children}</>;
}
