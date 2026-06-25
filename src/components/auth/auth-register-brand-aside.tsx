"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { BrandLogo } from "@/components/shared/brand-logo";
import { useMarketingText } from "@/hooks/use-marketing-text";
import { cn } from "@/lib/utils";

interface AuthRegisterBrandAsideProps {
  className?: string;
}

export function AuthRegisterBrandAside({ className }: AuthRegisterBrandAsideProps) {
  const { t } = useMarketingText();
  const year = new Date().getFullYear();

  const benefits = [
    t("auth.registerBenefit1"),
    t("auth.registerBenefit2"),
    t("auth.registerBenefit3"),
    t("auth.registerBenefit4"),
  ];

  return (
    <aside
      className={cn(
        "relative flex flex-col justify-between overflow-hidden bg-icvf-navy-dark p-8 sm:p-10 lg:p-12",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(28,37,71,0.96) 0%, rgba(39,52,97,0.92) 52%, rgba(245,166,35,0.14) 100%), radial-gradient(ellipse at 18% 82%, rgba(245,166,35,0.22), transparent 58%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(245,166,35,0.12),_transparent_52%)]" />

      <div className="relative">
        <Link href="/" className="inline-flex" aria-label={BRAND.name}>
          <BrandLogo size="lg" priority light />
        </Link>

        <h2 className="mt-10 max-w-md text-3xl font-bold leading-tight text-white sm:text-4xl lg:mt-14">
          {t("auth.registerHeroTitle")}
          <span className="text-icvf-accent"> {t("auth.loginHeroAccent")}</span>
        </h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-white/75 sm:text-base">{t("auth.registerHeroSub")}</p>

        <ul className="mt-10 space-y-4">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-3">
              <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-icvf-accent">
                <Check className="size-3 text-icvf-navy-dark" strokeWidth={3} />
              </div>
              <span className="text-sm leading-relaxed text-white/85">{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative mt-10 text-xs text-icvf-accent/80">
        © {year} {BRAND.name}. {t("auth.allRightsReserved")}
      </p>
    </aside>
  );
}
