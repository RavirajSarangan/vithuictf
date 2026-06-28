import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { MarketingPanel } from "@/components/landing/marketing-layout";
import { cn } from "@/lib/utils";

function courseInitials(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "ICT";
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return `${words[0]![0] ?? ""}${words[1]![0] ?? ""}`.toUpperCase();
}

export interface CourseCardProps {
  title: string;
  description?: string;
  coverImageUrl?: string;
  category?: string;
  durationMonths?: number;
  teacherName?: string;
  href?: string;
  compact?: boolean;
  index?: number;
  footer?: React.ReactNode;
  className?: string;
}

export function CourseThumbnail({
  title,
  coverImageUrl,
  className,
}: {
  title: string;
  coverImageUrl?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-icvf-navy/10 to-icvf-accent/20 aspect-square",
        className
      )}
    >
      {coverImageUrl ? (
        <Image src={coverImageUrl} alt={title} fill className="object-cover" sizes="80px" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-icvf-navy">
          {courseInitials(title)}
        </div>
      )}
    </div>
  );
}

export function CourseCard({
  title,
  description,
  coverImageUrl,
  category,
  durationMonths,
  teacherName,
  href,
  compact = false,
  index,
  footer,
  className,
}: CourseCardProps) {
  const durationLabel = durationMonths ? `${durationMonths} months` : null;

  if (compact) {
    return (
      <MarketingPanel className={cn("flex h-full flex-col overflow-hidden p-0", className)}>
        <div className="relative aspect-square w-full">
          {coverImageUrl ? (
            <Image src={coverImageUrl} alt={title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-icvf-navy/10 to-icvf-accent/25 text-2xl font-bold text-icvf-navy">
              {courseInitials(title)}
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-4">
          {category ? (
            <span className="text-xs font-medium uppercase tracking-wide text-icvf-accent">{category}</span>
          ) : null}
          <h3 className="mt-1 text-base font-bold text-icvf-navy">{title}</h3>
          {description ? (
            <p className="mt-1 line-clamp-2 flex-1 text-sm text-icvf-text-light">{description}</p>
          ) : null}
          {teacherName ? (
            <p className="mt-2 text-xs text-icvf-text-light">Staff: {teacherName}</p>
          ) : null}
        </div>
      </MarketingPanel>
    );
  }

  const body = (
    <MarketingPanel className={cn("flex h-full flex-col overflow-hidden p-0", className)}>
      <div className="relative aspect-square w-full">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-icvf-navy/10 to-icvf-accent/25 text-3xl font-bold text-icvf-navy">
            {courseInitials(title)}
          </div>
        )}
        {typeof index === "number" ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold text-icvf-accent">
            {String(index).padStart(2, "0")}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        {category ? (
          <span className="text-xs font-semibold uppercase tracking-wide text-icvf-accent">{category}</span>
        ) : null}
        <h3 className="mt-1 text-lg font-bold text-icvf-navy sm:text-xl">{title}</h3>
        {description ? (
          <p className="mt-2 flex-1 text-sm leading-relaxed text-icvf-text-light">{description}</p>
        ) : null}
        {footer ?? (
          <div className="mt-5 flex items-center justify-between border-t border-icvf-border pt-4">
            <span className="flex items-center gap-1.5 text-xs text-icvf-text-light">
              {durationLabel ? (
                <>
                  <Clock className="size-3.5" />
                  {durationLabel}
                </>
              ) : teacherName ? (
                teacherName
              ) : null}
            </span>
            {href ? (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-icvf-navy">
                View
                <ArrowRight className="size-3.5" />
              </span>
            ) : null}
          </div>
        )}
      </div>
    </MarketingPanel>
  );

  if (href) {
    return (
      <Link href={href} className="group block h-full">
        {body}
      </Link>
    );
  }

  return <div className="group h-full">{body}</div>;
}
