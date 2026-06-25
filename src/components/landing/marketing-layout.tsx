import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CanvasEyebrow, CanvasSection } from "@/components/canvas";
import { ButtonLink } from "@/components/shared/button-link";
import { SectionHeading, type SectionHeadingProps } from "@/components/shared/section-heading";
import { cn } from "@/lib/utils";

type MarketingSectionTone = "light" | "surface" | "gradient";

export function MarketingSection({
  id,
  tone = "light",
  children,
  className,
}: {
  id?: string;
  tone?: MarketingSectionTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <CanvasSection id={id} tone={tone} className={cn("scroll-mt-20", className)}>
      {children}
    </CanvasSection>
  );
}

/** Full-bleed navy register band (no CanvasSection wrapper) */
export function MarketingBleedCtaSection({
  id,
  children,
  className,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative scroll-mt-20 overflow-x-hidden bg-gradient-to-br from-[#0a1628] via-icvf-navy-dark to-[#0d2137] py-20 sm:py-24 lg:py-28",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(245,166,35,0.15) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(245,166,35,0.12),_transparent_65%)]" />
      <MarketingContainer className="relative">{children}</MarketingContainer>
    </section>
  );
}

export function MarketingCtaActions({
  registerLabel,
  loginLabel,
  registerHref = "/register",
  loginHref = "/login",
  showRegisterArrow = false,
  className,
}: {
  registerLabel: string;
  loginLabel: string;
  registerHref?: string;
  loginHref?: string;
  showRegisterArrow?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 sm:flex-row", className)}>
      <ButtonLink
        href={registerHref}
        variant="icvf"
        size="lg"
        className={cn("w-full gap-2 sm:w-auto", showRegisterArrow && "gap-2")}
      >
        {registerLabel}
        {showRegisterArrow ? <ArrowRight className="size-4" /> : null}
      </ButtonLink>
      <Link
        href={loginHref}
        className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-white/25 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
      >
        {loginLabel}
      </Link>
    </div>
  );
}

export function MarketingPortraitFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-3xl border-2 border-icvf-accent/30 bg-white p-1.5 shadow-xl",
        className
      )}
    >
      <div className="relative h-full min-h-full overflow-hidden rounded-[1.25rem]">{children}</div>
    </div>
  );
}

export function MarketingContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6", className)}>{children}</div>;
}

export function MarketingSectionIntro({
  align = "left",
  ...props
}: SectionHeadingProps) {
  return (
    <SectionHeading
      {...props}
      align={align}
      className={cn("mb-10 sm:mb-14 lg:mb-16", props.className)}
    />
  );
}

/** Unified light-section card shell */
export function MarketingPanel({
  children,
  className,
  featured,
}: {
  children: React.ReactNode;
  className?: string;
  featured?: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-3xl border p-6 transition-all duration-300 sm:p-7",
        featured
          ? "border-icvf-accent/30 bg-gradient-to-br from-icvf-navy to-icvf-navy-dark text-white shadow-lg"
          : "border-icvf-border bg-white shadow-sm hover:-translate-y-0.5 hover:border-icvf-accent/30 hover:shadow-md",
        className
      )}
    >
      <div className="relative">{children}</div>
    </div>
  );
}

/** Unified dark-section card shell (gradient / navy sections) */
export function MarketingDarkPanel({
  children,
  className,
  featured,
}: {
  children: React.ReactNode;
  className?: string;
  featured?: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-3xl border p-6 backdrop-blur-sm transition-all duration-300 sm:p-7",
        featured
          ? "border-icvf-accent/25 bg-gradient-to-br from-icvf-navy/80 via-[#0f1f35] to-[#0a1628] shadow-[0_0_60px_-20px_rgba(245,166,35,0.35)]"
          : "border-white/10 bg-white/[0.03] hover:-translate-y-0.5 hover:border-white/20",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(245,166,35,0.08),_transparent_50%)] opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative">{children}</div>
    </div>
  );
}

/** Unified section CTA block — same style on every section */
export function MarketingSectionCta({
  title,
  subtitle,
  badge,
  children,
  className,
  variant = "band",
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  children?: React.ReactNode;
  className?: string;
  variant?: "band" | "flat";
}) {
  const content = (
    <>
      {badge ? (
        <CanvasEyebrow variant="accent" className="mb-4">
          {badge}
        </CanvasEyebrow>
      ) : null}
      <p className="text-xl font-bold text-white sm:text-2xl lg:text-3xl">{title}</p>
      {subtitle ? <p className="mx-auto mt-2 max-w-xl text-sm text-white/70 sm:text-base">{subtitle}</p> : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </>
  );

  if (variant === "flat") {
    return <div className={cn("text-center", className)}>{content}</div>;
  }

  return (
    <MarketingCtaBand className={cn("mt-14 sm:mt-16", className)}>{content}</MarketingCtaBand>
  );
}

/** DM-style horizontal rank list */
export function MarketingHorizontalRankList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "-mx-4 flex gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:-mx-6 sm:gap-4 sm:px-6 [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {children}
    </div>
  );
}

export function MarketingHorizontalRankCard({
  rank,
  name,
  meta,
  className,
}: {
  rank: number;
  name: string;
  meta: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-[min(100%,240px)] shrink-0 items-center gap-4 rounded-2xl border border-icvf-border bg-white p-4 shadow-sm sm:min-w-[260px]",
        className
      )}
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-icvf-navy to-icvf-navy-dark text-lg font-bold text-icvf-accent">
        {String(rank).padStart(2, "0")}
      </span>
      <div className="min-w-0">
        <p className="truncate font-semibold text-icvf-navy">{name}</p>
        <p className="text-xs text-icvf-text-light">{meta}</p>
      </div>
    </div>
  );
}

/** DM-style numbered join pillars (success stories) */
export function MarketingJoinPillars({
  items,
  className,
}: {
  items: { index: number; title: string; description: string }[];
  className?: string;
}) {
  return (
    <div className={cn("mb-10 grid gap-4 grid-cols-1 sm:grid-cols-3", className)}>
      {items.map((item) => (
        <MarketingPanel key={item.index} className="p-5 sm:p-6">
          <span className="text-sm font-bold tracking-[0.2em] text-icvf-accent">
            {String(item.index).padStart(2, "0")}
          </span>
          <h3 className="mt-3 text-lg font-bold text-icvf-navy">{item.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-icvf-text-light">{item.description}</p>
        </MarketingPanel>
      ))}
    </div>
  );
}

/** Hero portal preview — featured MarketingPanel with ring accent */
export function MarketingHeroPreview({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <MarketingPanel
      featured
      className={cn("shadow-2xl ring-1 ring-icvf-accent/20", className)}
    >
      {children}
    </MarketingPanel>
  );
}

/** Inner tile for dark featured panels (hero preview, AI card) */
export function MarketingDarkTile({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-white/10 bg-white/5 p-4", className)}>
      {children}
    </div>
  );
}

interface MarketingNumberedCardProps {
  index: number;
  title: string;
  description: string;
  icon?: LucideIcon;
  className?: string;
  featured?: boolean;
  footer?: React.ReactNode;
}

export function MarketingNumberedCard({
  index,
  title,
  description,
  icon: Icon,
  className,
  featured,
  footer,
}: MarketingNumberedCardProps) {
  return (
    <MarketingPanel featured={featured} className={cn("flex h-full flex-col", className)}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-bold tracking-[0.2em] text-icvf-accent">
          {String(index).padStart(2, "0")}
        </span>
        {Icon ? (
          <div
            className={cn(
              "flex size-11 items-center justify-center rounded-2xl",
              featured ? "bg-white/10" : "bg-icvf-navy/8"
            )}
          >
            <Icon className={cn("size-5", featured ? "text-icvf-accent" : "text-icvf-navy")} />
          </div>
        ) : null}
      </div>
      <h3 className={cn("mt-4 text-lg font-bold sm:text-xl", featured ? "text-white" : "text-icvf-navy")}>
        {title}
      </h3>
      <p className={cn("mt-2 flex-1 text-sm leading-relaxed", featured ? "text-white/75" : "text-icvf-text-light")}>
        {description}
      </p>
      {footer ? <div className="mt-5">{footer}</div> : null}
    </MarketingPanel>
  );
}

interface MarketingStatHeroProps {
  value: React.ReactNode;
  label: string;
  className?: string;
  featured?: boolean;
}

export function MarketingStatHero({ value, label, className, featured }: MarketingStatHeroProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-5 text-center sm:px-6 sm:py-6",
        featured
          ? "border-icvf-accent/30 bg-gradient-to-br from-icvf-navy to-icvf-navy-dark text-white shadow-lg"
          : "border-icvf-border bg-white shadow-sm",
        className
      )}
    >
      <p className={cn("text-3xl font-bold sm:text-4xl lg:text-5xl", featured ? "text-white" : "text-icvf-navy")}>
        {value}
      </p>
      <p
        className={cn(
          "mt-2 text-[11px] font-semibold uppercase tracking-[0.16em]",
          featured ? "text-white/60" : "text-icvf-text-light"
        )}
      >
        {label}
      </p>
    </div>
  );
}

interface MarketingFeatureGridItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function MarketingFeatureGrid({
  items,
  className,
  dark,
}: {
  items: MarketingFeatureGridItem[];
  className?: string;
  dark?: boolean;
}) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <MarketingPanel
            key={item.title}
            className={cn(
              "p-5 hover:translate-y-0",
              dark && "border-white/10 bg-white/5 text-white hover:border-icvf-accent/30"
            )}
          >
            <div
              className={cn(
                "flex size-11 items-center justify-center rounded-xl",
                dark ? "bg-icvf-accent/15" : "bg-icvf-navy/8"
              )}
            >
              <Icon className="size-5 text-icvf-accent" />
            </div>
            <h4 className={cn("mt-4 font-semibold", dark ? "text-white" : "text-icvf-navy")}>{item.title}</h4>
            <p className={cn("mt-1.5 text-sm leading-relaxed", dark ? "text-white/65" : "text-icvf-text-light")}>
              {item.description}
            </p>
          </MarketingPanel>
        );
      })}
    </div>
  );
}

export function MarketingCtaBand({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-icvf-accent/20 bg-gradient-to-br from-icvf-navy via-icvf-navy-dark to-[#0d2137] px-6 py-10 text-center shadow-xl sm:px-10 sm:py-12",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(245,166,35,0.12),_transparent_55%)]" />
      <div className="relative">{children}</div>
    </div>
  );
}
