import { createClient } from "@/lib/supabase/server";
import { mapBlogCategory, mapBlogPost } from "@/lib/supabase/mappers";
import type { BlogCategory, BlogPost } from "@/types";

const POST_SELECT = `
  *,
  blog_categories ( name, slug )
`;

function isMissingBlogSchemaError(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "PGRST205" ||
    message.includes("schema cache") ||
    message.includes("blog_posts") ||
    message.includes("blog_categories")
  );
}

export async function getPublishedBlogCategories(): Promise<BlogCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .order("name");

  if (error) {
    if (isMissingBlogSchemaError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map(mapBlogCategory);
}

export async function getPublishedBlogPosts(options?: {
  categorySlug?: string;
  page?: number;
  pageSize?: number;
  excludeSlug?: string;
}): Promise<{ posts: BlogPost[]; total: number }> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 12;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();

  let categoryId: string | null = null;
  if (options?.categorySlug) {
    const { data: category } = await supabase
      .from("blog_categories")
      .select("id")
      .eq("slug", options.categorySlug)
      .eq("is_active", true)
      .maybeSingle();
    if (!category) return { posts: [], total: 0 };
    categoryId = category.id;
  }

  let query = supabase
    .from("blog_posts")
    .select(POST_SELECT, { count: "exact" })
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });

  if (categoryId) query = query.eq("category_id", categoryId);
  if (options?.excludeSlug) query = query.neq("slug", options.excludeSlug);

  const { data, error, count } = await query.range(from, to);
  if (error) {
    if (isMissingBlogSchemaError(error)) return { posts: [], total: 0 };
    throw new Error(error.message);
  }

  return {
    posts: (data ?? []).map(mapBlogPost),
    total: count ?? 0,
  };
}

export async function getFeaturedBlogPost(): Promise<BlogPost | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select(POST_SELECT)
    .eq("status", "published")
    .eq("is_featured", true)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingBlogSchemaError(error)) return null;
    throw new Error(error.message);
  }
  return data ? mapBlogPost(data) : null;
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select(POST_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .maybeSingle();

  if (error) {
    if (isMissingBlogSchemaError(error)) return null;
    throw new Error(error.message);
  }
  return data ? mapBlogPost(data) : null;
}

export async function getRelatedBlogPosts(post: BlogPost, limit = 3): Promise<BlogPost[]> {
  if (!post.categoryId) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select(POST_SELECT)
    .eq("status", "published")
    .eq("category_id", post.categoryId)
    .neq("slug", post.slug)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingBlogSchemaError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map(mapBlogPost);
}

export async function getPublishedBlogSlugs(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("status", "published")
    .lte("published_at", new Date().toISOString());

  if (error) {
    if (isMissingBlogSchemaError(error)) return [];
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => row.slug);
}
