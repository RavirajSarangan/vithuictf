import { cn } from "@/lib/utils";

interface CanvasEyebrowProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "accent" | "light";
}

export function CanvasEyebrow({ children, className, variant = "default" }: CanvasEyebrowProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em]",
        variant === "default" && "border border-white/10 bg-white/5 text-white/55",
        variant === "accent" && "border border-icvf-accent/30 bg-icvf-accent/10 text-icvf-accent",
        variant === "light" && "border border-icvf-border bg-icvf-surface text-icvf-navy",
        className
      )}
    >
      {children}
    </span>
  );
}

interface CanvasHeadingProps {
  eyebrow?: string;
  title: string;
  accent?: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
}

export function CanvasHeading({
  eyebrow,
  title,
  accent,
  subtitle,
  align = "center",
  className,
}: CanvasHeadingProps) {
  return (
    <div className={cn("mb-12", align === "center" && "text-center", className)}>
      {eyebrow ? <CanvasEyebrow className="mb-4">{eyebrow}</CanvasEyebrow> : null}
      <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl lg:text-5xl">
        {title}
        {accent ? (
          <>
            <br />
            <span className="text-icvf-accent">{accent}</span>
          </>
        ) : null}
      </h2>
      {subtitle ? (
        <p
          className={cn(
            "mt-4 max-w-2xl text-base leading-relaxed text-white/55 md:text-lg",
            align === "center" && "mx-auto"
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

interface CanvasSectionProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
  tone?: "dark" | "darker" | "panel" | "navy" | "gradient" | "light" | "surface";
}

export function CanvasSection({ id, children, className, tone = "dark" }: CanvasSectionProps) {
  const isLight = tone === "light" || tone === "surface";

  return (
    <section
      id={id}
      className={cn(
        "relative overflow-x-hidden py-20 sm:py-24 lg:py-28",
        tone === "dark" && "bg-canvas-bg",
        tone === "darker" && "bg-canvas-bg-elevated",
        tone === "panel" && "bg-canvas-panel",
        tone === "navy" && "bg-icvf-navy-dark",
        tone === "light" && "bg-white text-icvf-text-dark",
        tone === "surface" && "bg-icvf-surface text-icvf-text-dark",
        tone === "gradient" &&
          "bg-gradient-to-br from-[#0a1628] via-icvf-navy-dark to-[#0d2137]",
        className
      )}
    >
      {!isLight && (tone === "navy" || tone === "gradient" ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(245,166,35,0.15) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(245,166,35,0.12),_transparent_65%)]" />
        </>
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(245,166,35,0.06),_transparent_55%)]" />
      ))}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">{children}</div>
    </section>
  );
}

export function CanvasDivider({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent",
        className
      )}
    />
  );
}

interface CanvasStatChipProps {
  value: string;
  label: string;
  className?: string;
}

export function CanvasStatChip({ value, label, className }: CanvasStatChipProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center backdrop-blur-sm",
        className
      )}
    >
      <p className="text-lg font-semibold text-white md:text-xl">{value}</p>
      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">{label}</p>
    </div>
  );
}

interface CanvasBentoCardProps {
  children: React.ReactNode;
  className?: string;
  featured?: boolean;
}

export function CanvasBentoCard({ children, className, featured }: CanvasBentoCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-3xl border p-6 transition-all duration-300",
        featured
          ? "border-icvf-accent/25 bg-gradient-to-br from-icvf-navy/80 via-canvas-panel to-canvas-bg-elevated shadow-[0_0_60px_-20px_rgba(245,166,35,0.35)]"
          : "border-white/10 bg-canvas-panel hover:border-white/20 hover:bg-white/[0.04]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(245,166,35,0.08),_transparent_50%)] opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative">{children}</div>
    </div>
  );
}

interface CanvasPremiumCardProps {
  children: React.ReactNode;
  className?: string;
  featured?: boolean;
}

export function CanvasPremiumCard({ children, className, featured }: CanvasPremiumCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-3xl border p-6 backdrop-blur-sm transition-all duration-300",
        featured
          ? "border-icvf-accent/25 bg-gradient-to-br from-icvf-navy/80 via-canvas-panel to-canvas-bg-elevated shadow-[0_0_60px_-20px_rgba(245,166,35,0.35)] hover:-translate-y-0.5"
          : "border-white/10 bg-white/[0.03] hover:-translate-y-0.5 hover:border-white/20",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(245,166,35,0.08),_transparent_50%)] opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative">{children}</div>
    </div>
  );
}

interface CanvasNumberedStepProps {
  number: string;
  title: string;
  description: string;
  className?: string;
}

export function CanvasNumberedStep({ number, title, description, className }: CanvasNumberedStepProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/10 bg-canvas-panel p-6 backdrop-blur-sm",
        className
      )}
    >
      <p className="text-sm font-medium tracking-[0.2em] text-white/35">{number}</p>
      <h3 className="mt-3 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/55">{description}</p>
    </div>
  );
}

interface LightPremiumCardProps {
  children: React.ReactNode;
  className?: string;
  featured?: boolean;
}

export function LightPremiumCard({ children, className, featured }: LightPremiumCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-3xl border p-6 transition-all duration-300",
        featured
          ? "border-icvf-accent/30 bg-gradient-to-br from-icvf-navy to-icvf-navy-dark text-white shadow-lg hover:-translate-y-0.5"
          : "border-icvf-border bg-white shadow-sm hover:-translate-y-0.5 hover:border-icvf-accent/40 hover:shadow-md",
        className
      )}
    >
      <div className="relative">{children}</div>
    </div>
  );
}

interface LightStatChipProps {
  value: string;
  label: string;
  className?: string;
}

export function LightStatChip({ value, label, className }: LightStatChipProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-icvf-border bg-white px-4 py-3 text-center shadow-sm",
        className
      )}
    >
      <p className="text-lg font-semibold text-icvf-navy md:text-xl">{value}</p>
      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.16em] text-icvf-text-light">{label}</p>
    </div>
  );
}
