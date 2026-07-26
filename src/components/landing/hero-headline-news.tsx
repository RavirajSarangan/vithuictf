import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HeadlineNews } from "@/types";

export function HeroHeadlineNews({ headlineNews }: { headlineNews: HeadlineNews | null }) {
  if (!headlineNews) return null;
  if (!headlineNews.title.trim() && !headlineNews.caption.trim()) return null;

  const hasLink = Boolean(headlineNews.linkUrl.trim());
  const hasImage = Boolean(headlineNews.imageUrl.trim());
  const isExternal = /^https?:\/\//.test(headlineNews.linkUrl);

  const content = (
    <>
      {hasImage ? (
        <div className="relative w-32 shrink-0 overflow-hidden rounded-xl bg-icvf-accent/10 ring-1 ring-icvf-navy-dark/10 sm:w-36">
          <Image
            src={headlineNews.imageUrl}
            alt={headlineNews.title || "Headline news"}
            width={400}
            height={500}
            sizes="144px"
            className="h-auto w-full object-contain"
          />
        </div>
      ) : (
        <div className="flex aspect-[4/5] w-32 shrink-0 items-center justify-center rounded-xl bg-icvf-accent/15 text-icvf-accent sm:w-36">
          <Newspaper className="size-6" aria-hidden />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-icvf-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-icvf-accent-hover">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-icvf-accent opacity-75 motion-reduce:animate-none" />
            <span className="relative inline-flex size-1.5 rounded-full bg-icvf-accent" />
          </span>
          {headlineNews.tagLabel || "News"}
        </div>
        {headlineNews.title ? (
          <p className="mt-1 truncate text-sm font-bold text-icvf-navy-dark">
            {headlineNews.title}
          </p>
        ) : null}
        {headlineNews.caption ? (
          <p className="mt-0.5 line-clamp-1 text-xs text-icvf-text-light">
            {headlineNews.caption}
          </p>
        ) : null}
      </div>

      {hasLink ? (
        <ChevronRight
          className="size-4 shrink-0 text-icvf-accent transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      ) : null}
    </>
  );

  const className = cn(
    "hero-enter hero-enter-3 group mt-4 flex w-full items-center gap-2.5 rounded-2xl border border-icvf-accent/25 bg-white/90 p-2.5 shadow-[0_8px_28px_-12px_rgba(245,166,35,0.35)] backdrop-blur-sm transition-all sm:mt-5 sm:max-w-md sm:gap-3 sm:p-3",
    hasLink &&
      "cursor-pointer hover:-translate-y-0.5 hover:border-icvf-accent/50 hover:shadow-[0_12px_32px_-12px_rgba(245,166,35,0.5)]"
  );

  if (hasLink) {
    return (
      <Link
        href={headlineNews.linkUrl}
        className={className}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
      >
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
