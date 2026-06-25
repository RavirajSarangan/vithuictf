import { cn } from "@/lib/utils";
import { CanvasEyebrow } from "@/components/canvas";

export interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: "default" | "accent";
  accent?: string;
  align?: "left" | "center";
  light?: boolean;
  className?: string;
}

export function SectionHeading({
  title,
  subtitle,
  badge,
  badgeVariant = "default",
  accent,
  align = "center",
  light = true,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("mb-12", align === "center" && "text-center", className)}>
      {badge ? (
        <CanvasEyebrow className="mb-4" variant={light ? badgeVariant : badgeVariant === "accent" ? "accent" : "light"}>
          {badge}
        </CanvasEyebrow>
      ) : null}
      <h2
        className={cn(
          "text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-[2.75rem] lg:leading-[1.1]",
          light ? "text-white" : "text-icvf-text-dark"
        )}
      >
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
            "mt-4 text-base leading-relaxed md:text-lg",
            align === "center" && "mx-auto max-w-2xl",
            light ? "text-white/55" : "text-icvf-text-light"
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

/** Enforces premium marketing heading defaults (white + amber accent line). */
export function PremiumSectionHeading(props: SectionHeadingProps) {
  return <SectionHeading light align="center" {...props} />;
}
