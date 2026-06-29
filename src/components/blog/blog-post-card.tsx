import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, Clock } from "lucide-react";
import type { BlogPost } from "@/types";
import { MarketingPanel } from "@/components/landing/marketing-layout";
import { BlogStorageImage } from "@/components/blog/blog-storage-image";
import { BlogPostShare } from "@/components/blog/blog-post-share";
import { BlogViewCount } from "@/components/blog/blog-view-count";

interface BlogPostCardProps {
  post: BlogPost;
  featured?: boolean;
  readMoreLabel?: string;
}

export function BlogPostCard({ post, featured = false, readMoreLabel = "Read more" }: BlogPostCardProps) {
  const dateLabel = post.publishedAt
    ? format(new Date(post.publishedAt), "MMM d, yyyy")
    : null;

  if (featured) {
    return (
      <MarketingPanel featured className="overflow-hidden p-0 md:grid md:grid-cols-2 md:gap-0">
        <Link
          href={`/blog/${post.slug}`}
          className="relative block min-h-56 overflow-hidden bg-white/5 md:min-h-full"
        >
          {post.coverImageUrl ? (
            <BlogStorageImage
              src={post.coverImageUrl}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-300 hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="flex h-full min-h-56 items-center justify-center bg-white/5 text-sm font-semibold uppercase tracking-[0.16em] text-white/50">
              ICTF Blog
            </div>
          )}
        </Link>
        <div className="flex flex-col p-6 md:p-8">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-white/60">
            {post.categoryName && (
              <span className="rounded-full bg-icvf-accent/20 px-2.5 py-0.5 font-semibold text-icvf-accent">
                {post.categoryName}
              </span>
            )}
            {dateLabel && <time dateTime={post.publishedAt ?? undefined}>{dateLabel}</time>}
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              {post.readingTimeMinutes} min read
            </span>
            <BlogViewCount postId={post.id} initialCount={post.viewCount} variant="dark" />
          </div>
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            <Link href={`/blog/${post.slug}`} className="hover:text-icvf-accent">
              {post.title}
            </Link>
          </h2>
          {post.excerpt && (
            <p className="mt-3 text-base leading-relaxed text-white/75">{post.excerpt}</p>
          )}
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
            <Link
              href={`/blog/${post.slug}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-icvf-accent hover:underline"
            >
              {readMoreLabel}
              <ArrowRight className="size-4" />
            </Link>
            <BlogPostShare post={post} variant="dark" />
          </div>
        </div>
      </MarketingPanel>
    );
  }

  return (
    <MarketingPanel className="flex h-full flex-col overflow-hidden p-0 hover:-translate-y-0.5">
      <Link href={`/blog/${post.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-icvf-navy/5">
        {post.coverImageUrl ? (
          <BlogStorageImage
            src={post.coverImageUrl}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full min-h-40 items-center justify-center bg-gradient-to-br from-icvf-navy/8 to-icvf-accent/10 text-sm font-semibold uppercase tracking-[0.14em] text-icvf-navy/45">
            ICTF Blog
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5 md:p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-icvf-text-light">
          {post.categoryName && (
            <span className="rounded-full bg-icvf-accent/15 px-2.5 py-0.5 font-semibold text-icvf-navy">
              {post.categoryName}
            </span>
          )}
          {dateLabel && <time dateTime={post.publishedAt ?? undefined}>{dateLabel}</time>}
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {post.readingTimeMinutes} min read
          </span>
          <BlogViewCount postId={post.id} initialCount={post.viewCount} />
        </div>

        <h2 className="text-lg font-bold text-icvf-navy">
          <Link href={`/blog/${post.slug}`} className="hover:text-icvf-accent">
            {post.title}
          </Link>
        </h2>

        {post.excerpt && (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-icvf-text-light">{post.excerpt}</p>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
          <Link
            href={`/blog/${post.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-icvf-accent hover:underline"
          >
            {readMoreLabel}
            <ArrowRight className="size-4" />
          </Link>
          <BlogPostShare post={post} />
        </div>
      </div>
    </MarketingPanel>
  );
}
