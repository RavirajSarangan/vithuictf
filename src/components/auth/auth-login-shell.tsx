"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthLoginBrandAside } from "@/components/auth/auth-login-brand-aside";
import { StudentLoginForm } from "@/components/auth/student-login-form";
import { BrandLogo } from "@/components/shared/brand-logo";
import { useMarketingText } from "@/hooks/use-marketing-text";

export function AuthLoginShell() {
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
              <BrandLogo size="authLogin" priority />
              <p className="text-xs text-icvf-text-light">{t("auth.studentPortal")}</p>
            </Link>
          </div>

          <StudentLoginForm />
        </div>
      </div>
    </div>
  );
}
