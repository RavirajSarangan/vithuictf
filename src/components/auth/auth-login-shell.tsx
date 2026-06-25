"use client";

import Link from "next/link";
import { AuthLoginBrandAside } from "@/components/auth/auth-login-brand-aside";
import { StudentLoginForm } from "@/components/auth/student-login-form";
import { BrandLogo } from "@/components/shared/brand-logo";
import { useMarketingText } from "@/hooks/use-marketing-text";

export function AuthLoginShell() {
  const { t } = useMarketingText();

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AuthLoginBrandAside className="hidden lg:flex lg:min-h-screen lg:w-1/2" />

      <div className="flex min-h-screen flex-1 flex-col justify-center bg-white px-6 py-10 sm:px-10 lg:w-1/2 lg:px-14 lg:py-12 xl:px-20">
        <div className="mb-8 flex flex-col items-center gap-2 text-center lg:hidden">
          <Link href="/" className="flex flex-col items-center gap-2" aria-label={t("auth.studentPortal")}>
            <BrandLogo size="authLogin" priority />
            <p className="text-xs text-icvf-text-light">{t("auth.studentPortal")}</p>
          </Link>
        </div>

        <div className="mx-auto w-full max-w-md">
          <StudentLoginForm />
        </div>

        <p className="mx-auto mt-8 max-w-md text-center text-xs text-icvf-text-light lg:mt-8">
          <Link href="/" className="hover:text-icvf-accent hover:underline">
            ← Back to homepage
          </Link>
        </p>
      </div>
    </div>
  );
}
