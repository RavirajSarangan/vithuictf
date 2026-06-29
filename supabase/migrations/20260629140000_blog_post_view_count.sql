-- Track and expose live blog post view counts

ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS view_count BIGINT NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_blog_post_view_count(p_slug TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count BIGINT;
BEGIN
  UPDATE public.blog_posts
  SET view_count = view_count + 1
  WHERE slug = p_slug
    AND status = 'published'
    AND published_at IS NOT NULL
    AND published_at <= now()
  RETURNING view_count INTO v_count;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_blog_post_view_count(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_blog_post_view_count(TEXT) TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'blog_posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.blog_posts;
  END IF;
END $$;
