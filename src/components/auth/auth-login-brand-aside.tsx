"use client";

import Link from "next/link";
import { Bot, GraduationCap, Video } from "lucide-react";
import { useMarketingText } from "@/hooks/use-marketing-text";
import { BrandLogo } from "@/components/shared/brand-logo";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";

const featureIcons = [Video, GraduationCap, Bot] as const;

interface AuthLoginBrandAsideProps {
  className?: string;
}

export function AuthLoginBrandAside({ className }: AuthLoginBrandAsideProps) {
  const { t } = useMarketingText();
  const year = new Date().getFullYear();

  const features = [
    { title: t("auth.loginFeature1Title"), description: t("auth.loginFeature1Desc") },
    { title: t("auth.loginFeature2Title"), description: t("auth.loginFeature2Desc") },
    { title: t("auth.loginFeature3Title"), description: t("auth.loginFeature3Desc") },
  ];

  return (
    <aside
      className={cn(
        "relative flex flex-col justify-between overflow-hidden bg-icvf-navy-dark p-8 sm:p-10 lg:p-12",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(15,23,42,0.92) 0%, rgba(28,37,71,0.88) 50%, rgba(39,52,97,0.35) 100%), radial-gradient(ellipse at 20% 80%, rgba(245,166,35,0.22), transparent 55%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(245,166,35,0.12),_transparent_50%)]" />

      <div className="relative">
        <Link href="/" className="inline-flex" aria-label={BRAND.name}>
          <BrandLogo size="authLoginAside" priority className="brightness-0 invert" />
        </Link>

        <h2 className="mt-10 max-w-md text-3xl font-bold leading-tight text-white sm:text-4xl lg:mt-14">
          {t("auth.loginHeroTitle")}
          <span className="text-icvf-accent"> {t("auth.loginHeroAccent")}</span>
        </h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-white/75 sm:text-base">{t("auth.loginHeroSub")}</p>

        <ul className="mt-10 space-y-6">
          {features.map((feature, index) => {
            const Icon = featureIcons[index % featureIcons.length];
            return (
              <li key={feature.title} className="flex gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-icvf-accent/15 ring-1 ring-icvf-accent/25">
                  <Icon className="size-4 text-icvf-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{feature.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-white/65">{feature.description}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="relative mt-10 text-xs text-icvf-accent/80">
        © {year} {BRAND.name}. {t("auth.allRightsReserved")}
      </p>
    </aside>
  );
}
