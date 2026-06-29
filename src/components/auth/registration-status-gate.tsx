"use client";

import { usePathname } from "next/navigation";
import { StudentPageLoading } from "@/components/student/portal/student-portal-states";
import {
  RegistrationPendingScreen,
  RegistrationRejectedScreen,
} from "@/components/auth/registration-pending-screen";
import { useAuth } from "@/providers/auth-provider";
import { useStudentData } from "@/hooks/use-data";

const ALLOWED_PATHS = ["/settings", "/onboarding"];

export function RegistrationStatusGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const student = useStudentData();

  const status = student?.registrationStatus ?? "approved";
  const isStudent = user?.role === "student";
  const allowed = ALLOWED_PATHS.some((p) => pathname.startsWith(p));

  if (authLoading || (isStudent && student === undefined)) {
    return <StudentPageLoading rows={2} />;
  }

  if (!isStudent || allowed || status === "approved") {
    return <>{children}</>;
  }

  if (status === "pending") {
    return <RegistrationPendingScreen />;
  }

  if (status === "rejected") {
    return <RegistrationRejectedScreen />;
  }

  return <>{children}</>;
}
