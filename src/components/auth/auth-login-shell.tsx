"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminLoginForm } from "@/components/auth/admin-login-form";
import { AuthLoginBrandAside } from "@/components/auth/auth-login-brand-aside";
import { ContentTeamLoginForm } from "@/components/auth/content-team-login-form";
import { PaperCenterLoginForm } from "@/components/auth/paper-center-login-form";
import { StaffLoginForm } from "@/components/auth/staff-login-form";
import { StudentLoginForm } from "@/components/auth/student-login-form";
import { BrandLogo } from "@/components/shared/brand-logo";
import { Skeleton } from "@/components/ui/skeleton";
import { BRAND } from "@/lib/constants";
import { useMarketingText } from "@/hooks/use-marketing-text";

type AuthLoginVariant = "student" | "staff" | "admin" | "socialTracking" | "paperCenter";

function LoginFormFallback() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-8 w-56 rounded-lg" />
      <Skeleton className="h-5 w-full max-w-sm rounded-lg" />
      <Skeleton className="h-10 w-full rounded-xl" />
      <Skeleton className="h-10 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}

function LoginFormByVariant({
  variant,
  centerName,
  centerSlug,
}: {
  variant: AuthLoginVariant;
  centerName?: string;
  centerSlug?: string;
}) {
  switch (variant) {
    case "staff":
      return <StaffLoginForm />;
    case "admin":
      return (
        <Suspense fallback={<LoginFormFallback />}>
          <AdminLoginForm />
        </Suspense>
      );
    case "socialTracking":
      return <ContentTeamLoginForm />;
    case "paperCenter":
      return <PaperCenterLoginForm centerName={centerName} centerSlug={centerSlug} />;
    default:
      return <StudentLoginForm />;
  }
}

export function AuthLoginShell({
  variant = "student",
  centerName,
  centerSlug,
}: {
  variant?: AuthLoginVariant;
  centerName?: string;
  centerSlug?: string;
}) {
  const { t } = useMarketingText();

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AuthLoginBrandAside className="hidden lg:flex lg:min-h-screen lg:w-1/2" />

      <div className="flex min-h-screen flex-1 flex-col bg-white px-6 py-8 sm:px-10 lg:w-1/2 lg:px-14 lg:py-12 xl:px-20">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center lg:justify-start lg:pt-4">
          <div className="mb-4 lg:mb-6">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-icvf-navy transition-colors hover:text-icvf-accent"
            >
              <ArrowLeft className="size-4 shrink-0" aria-hidden />
              {t("results.backToHome")}
            </Link>
          </div>

          <div className="mb-8 flex flex-col items-center gap-2 text-center lg:hidden">
            <Link href="/" className="flex flex-col items-center gap-2" aria-label={t("auth.studentPortal")}>
              <BrandLogo size="authLoginMobile" src={BRAND.logoAuthMobile} priority />
              <p className="text-xs text-icvf-text-light">{t("auth.studentPortal")}</p>
            </Link>
          </div>

          <LoginFormByVariant variant={variant} centerName={centerName} centerSlug={centerSlug} />
        </div>
      </div>
    </div>
  );
}
