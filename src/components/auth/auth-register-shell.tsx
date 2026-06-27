"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthRegisterBrandAside } from "@/components/auth/auth-register-brand-aside";
import { StudentRegisterForm } from "@/components/auth/student-register-form";
import { BrandLogo } from "@/components/shared/brand-logo";
import { BRAND } from "@/lib/constants";
import { useMarketingText } from "@/hooks/use-marketing-text";

export function AuthRegisterShell() {
  const { t } = useMarketingText();

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AuthRegisterBrandAside className="hidden lg:flex lg:min-h-screen lg:w-[42%] xl:w-2/5" />

      <div className="flex min-h-screen flex-1 flex-col bg-gradient-to-b from-white via-icvf-surface/40 to-white lg:w-[58%] xl:w-3/5">
        <div className="flex flex-1 flex-col overflow-y-auto px-6 py-8 sm:px-10 lg:px-12 lg:py-10 xl:px-16">
          <div className="mb-4 lg:hidden">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-icvf-navy transition-colors hover:text-icvf-accent"
            >
              <ArrowLeft className="size-4 shrink-0" aria-hidden />
              {t("results.backToHome")}
            </Link>
          </div>

          <div className="mb-6 flex flex-col items-center gap-2 text-center lg:hidden">
            <Link href="/" className="flex flex-col items-center gap-2" aria-label={t("auth.registerHeading")}>
              <BrandLogo size="authLoginMobile" src={BRAND.logoAuthMobile} priority />
              <p className="text-xs text-icvf-text-light">{t("auth.registerHeading")}</p>
            </Link>
          </div>

          <div className="mx-auto w-full max-w-xl">
            <StudentRegisterForm />
          </div>

          <p className="mx-auto mt-8 hidden max-w-xl text-center text-xs text-icvf-text-light lg:block">
            <Link href="/" className="hover:text-icvf-accent hover:underline">
              ← {t("results.backToHome")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
