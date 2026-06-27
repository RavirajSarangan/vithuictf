import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Clock, ArrowLeft } from "lucide-react";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { absoluteUrl } from "@/lib/seo/site";
import {
  getBlogPostBySlug,
  getPublishedBlogSlugs,
  getRelatedBlogPosts,
} from "@/lib/blog/queries";
import { BlogPostContent } from "@/components/blog/blog-post-content";
import { BlogPostCard } from "@/components/blog/blog-post-card";
import { ArticleJsonLd } from "@/components/seo/json-ld";
import { MarketingContainer, MarketingSection } from "@/components/landing/marketing-layout";

export const revalidate = 60;

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const slugs = await getPublishedBlogSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) {
    return { title: "Post not found" };
  }

  return buildPageMetadata({
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || post.title,
    path: `/blog/${post.slug}`,
    ogImage: post.coverImageUrl || undefined,
    ogType: "article",
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const related = await getRelatedBlogPosts(post);
  const publishedLabel = post.publishedAt
    ? format(new Date(post.publishedAt), "MMMM d, yyyy")
    : null;

  return (
    <>
      <ArticleJsonLd
        title={post.title}
        description={post.excerpt || post.seoDescription}
        url={absoluteUrl(`/blog/${post.slug}`)}
        image={post.coverImageUrl || undefined}
        datePublished={post.publishedAt ?? post.createdAt}
        dateModified={post.updatedAt}
        authorName={post.authorName || "ICTF"}
      />

      <MarketingSection tone="light">
        <MarketingContainer className="max-w-3xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-icvf-accent hover:underline"
          >
            <ArrowLeft className="size-4" />
            Back to blog
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-icvf-text-light">
            {post.categoryName && post.categorySlug && (
              <Link
                href={`/blog?category=${post.categorySlug}`}
                className="rounded-full bg-icvf-accent/15 px-3 py-1 font-semibold text-icvf-navy hover:bg-icvf-accent/25"
              >
                {post.categoryName}
              </Link>
            )}
            {publishedLabel && (
              <time dateTime={post.publishedAt ?? undefined}>{publishedLabel}</time>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock className="size-4" />
              {post.readingTimeMinutes} min read
            </span>
            {post.authorName && <span>By {post.authorName}</span>}
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-icvf-navy md:text-4xl lg:text-5xl">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-4 text-lg leading-relaxed text-icvf-text-light">{post.excerpt}</p>
          )}
        </MarketingContainer>

        {post.coverImageUrl && (
          <MarketingContainer className="mt-8 max-w-5xl">
            <div className="relative aspect-[16/9] overflow-hidden rounded-3xl border border-icvf-border shadow-xl">
              <Image
                src={post.coverImageUrl}
                alt={post.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 960px"
              />
            </div>
          </MarketingContainer>
        )}

        <MarketingContainer className="mt-10 max-w-3xl pb-6">
          <BlogPostContent html={post.content} />

          {post.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2 border-t border-icvf-border pt-8">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-icvf-navy/5 px-3 py-1 text-xs font-semibold text-icvf-text-light"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </MarketingContainer>

        {related.length > 0 && (
          <div className="border-t border-icvf-border bg-white/60 py-12 md:py-16">
            <MarketingContainer>
              <h2 className="text-2xl font-bold text-icvf-navy">Related articles</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <BlogPostCard key={item.id} post={item} />
                ))}
              </div>
            </MarketingContainer>
          </div>
        )}
      </MarketingSection>
    </>
  );
}
