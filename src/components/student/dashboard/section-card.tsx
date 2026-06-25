import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  actionHref?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function SectionCard({
  title,
  description,
  icon: Icon,
  actionLabel,
  actionHref,
  children,
  className,
  contentClassName,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-2xl border border-icvf-border bg-white shadow-sm",
        className
      )}
    >
      <header className="flex items-start justify-between gap-2 border-b border-icvf-border/80 px-4 py-3 sm:gap-3 sm:px-5 sm:py-4">
        <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
          {Icon ? (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-icvf-navy/10 text-icvf-navy sm:size-9">
              <Icon className="size-4" />
            </div>
          ) : null}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-icvf-navy sm:text-base">{title}</h3>
            {description ? (
              <p className="mt-0.5 text-xs text-icvf-text-light">{description}</p>
            ) : null}
          </div>
        </div>
        {actionLabel && actionHref ? (
          <Link
            href={actionHref}
            className="shrink-0 pt-0.5 text-xs font-semibold text-icvf-accent hover:text-icvf-accent-hover hover:underline"
          >
            {actionLabel}
          </Link>
        ) : null}
      </header>
      <div className={cn("flex min-w-0 flex-1 flex-col p-4 sm:p-5", contentClassName)}>{children}</div>
    </section>
  );
}
