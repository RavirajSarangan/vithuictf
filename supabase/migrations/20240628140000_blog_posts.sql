-- Blog categories and posts for marketing CMS

CREATE TABLE public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT NOT NULL DEFAULT '',
  category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  seo_title TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  author_name TEXT NOT NULL DEFAULT '',
  reading_time_minutes INT NOT NULL DEFAULT 1,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX blog_posts_slug_idx ON public.blog_posts (slug);
CREATE INDEX blog_posts_status_published_idx ON public.blog_posts (status, published_at DESC NULLS LAST);
CREATE INDEX blog_posts_category_status_idx ON public.blog_posts (category_id, status, published_at DESC NULLS LAST);
CREATE INDEX blog_posts_featured_idx ON public.blog_posts (is_featured, published_at DESC NULLS LAST);
CREATE INDEX blog_categories_slug_idx ON public.blog_categories (slug);

CREATE OR REPLACE FUNCTION public.set_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_blog_posts_updated_at();

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY blog_categories_public_read
  ON public.blog_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY blog_categories_admin_write
  ON public.blog_categories FOR ALL
  USING (public.is_admin());

CREATE POLICY blog_posts_public_read
  ON public.blog_posts FOR SELECT
  USING (
    status = 'published'
    AND published_at IS NOT NULL
    AND published_at <= now()
  );

CREATE POLICY blog_posts_admin_write
  ON public.blog_posts FOR ALL
  USING (public.is_admin());
