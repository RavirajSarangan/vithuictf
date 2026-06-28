import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd, BlogIndexJsonLd } from "@/components/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { BLOG_SEO } from "@/lib/seo/keywords";
import {
  getFeaturedBlogPost,
  getPublishedBlogCategories,
  getPublishedBlogPosts,
} from "@/lib/blog/queries";
import { BlogPostCard } from "@/components/blog/blog-post-card";
import {
  MarketingContainer,
  MarketingSection,
  MarketingSectionIntro,
} from "@/components/landing/marketing-layout";
import { cn } from "@/lib/utils";

export const revalidate = 60;

interface BlogPageProps {
  searchParams: Promise<{ category?: string; page?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: BLOG_SEO.title.en,
    description: BLOG_SEO.description.en,
    path: "/blog",
    keywords: BLOG_SEO.keywords.en,
    alternateLocales: ["en"],
  });
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const categorySlug = params.category?.trim() || undefined;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 12;

  const [featured, { posts, total }, categories] = await Promise.all([
    categorySlug ? Promise.resolve(null) : getFeaturedBlogPost(),
    getPublishedBlogPosts({ categorySlug, page, pageSize }),
    getPublishedBlogCategories(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const gridPosts =
    featured && page === 1 && !categorySlug
      ? posts.filter((post) => post.id !== featured.id)
      : posts;

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
        ]}
      />
      <BlogIndexJsonLd postCount={total} locale="en" />
      <MarketingSection tone="light">
      <MarketingSectionIntro
        as="h1"
        badge="ICTF Blog"
        title="ICT tips, exam guidance &"
        accent="institute updates"
        subtitle="Practical articles for O/L and A/L ICT students across Sri Lanka — study strategies, exam preparation, and news from the ICTF institute network."
        light={false}
        badgeVariant="accent"
      />

      {categories.length > 0 && (
        <MarketingContainer className="mb-8 flex flex-wrap gap-2">
          <Link
            href="/blog"
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
              !categorySlug
                ? "bg-icvf-navy text-white"
                : "border border-icvf-border bg-white text-icvf-navy hover:border-icvf-accent/40"
            )}
          >
            All
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/blog?category=${category.slug}`}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                categorySlug === category.slug
                  ? "bg-icvf-navy text-white"
                  : "border border-icvf-border bg-white text-icvf-navy hover:border-icvf-accent/40"
              )}
            >
              {category.name}
            </Link>
          ))}
        </MarketingContainer>
      )}

      {featured && page === 1 && !categorySlug && (
        <MarketingContainer className="mb-10">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-icvf-accent">
            Featured
          </p>
          <BlogPostCard post={featured} featured readMoreLabel="Read article" />
        </MarketingContainer>
      )}

      <MarketingContainer>
        {gridPosts.length === 0 ? (
          total === 0 ? (
            <div className="rounded-3xl border border-dashed border-icvf-border bg-white px-6 py-16 text-center shadow-sm">
              <h2 className="text-xl font-bold text-icvf-navy">No posts yet</h2>
              <p className="mt-2 text-icvf-text-light">
                {categorySlug
                  ? "No published posts in this category yet."
                  : "Check back soon for ICT study tips and institute updates."}
              </p>
            </div>
          ) : null
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {gridPosts.map((post) => (
              <BlogPostCard key={post.id} post={post} readMoreLabel="Read more" />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-3">
            {page > 1 && (
              <Link
                href={`/blog?${new URLSearchParams({
                  ...(categorySlug ? { category: categorySlug } : {}),
                  page: String(page - 1),
                }).toString()}`}
                className="rounded-xl border border-icvf-border bg-white px-4 py-2 text-sm font-semibold text-icvf-navy transition-colors hover:border-icvf-accent/40"
              >
                Previous
              </Link>
            )}
            <span className="text-sm text-icvf-text-light">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/blog?${new URLSearchParams({
                  ...(categorySlug ? { category: categorySlug } : {}),
                  page: String(page + 1),
                }).toString()}`}
                className="rounded-xl border border-icvf-border bg-white px-4 py-2 text-sm font-semibold text-icvf-navy transition-colors hover:border-icvf-accent/40"
              >
                Next
              </Link>
            )}
          </div>
        )}
      </MarketingContainer>
      </MarketingSection>
    </>
  );
}
