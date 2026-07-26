-- Admin-managed "Headline News" spot shown inline in the homepage hero section

CREATE TABLE public.headline_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_label TEXT NOT NULL DEFAULT 'News',
  title TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  link_label TEXT NOT NULL DEFAULT '',
  link_url TEXT NOT NULL DEFAULT '',
  priority INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX headline_news_active_priority_idx
  ON public.headline_news (is_active, priority DESC, created_at DESC);

ALTER TABLE public.headline_news ENABLE ROW LEVEL SECURITY;

CREATE POLICY headline_news_public_read
  ON public.headline_news FOR SELECT
  USING (is_active = true);

CREATE POLICY headline_news_admin_write
  ON public.headline_news FOR ALL
  USING (public.is_admin());
