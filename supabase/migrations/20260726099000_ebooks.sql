-- Homepage e-book feature: super-admin managed cover/text/style, download
-- distributed via an external preview link + a Google Drive link (no file
-- upload pipeline). Mirrors the shape of result_check_links (20260716120000).

CREATE TABLE public.ebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT NOT NULL DEFAULT '',
  badge_label TEXT NOT NULL DEFAULT 'DOWNLOAD',
  footer_label TEXT NOT NULL DEFAULT 'E-BOOK',
  accent_color TEXT NOT NULL DEFAULT '#F5A623',
  preview_url TEXT,
  drive_link TEXT,
  download_count INT NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ebooks_published_sort_idx ON public.ebooks (published, sort_order);

ALTER TABLE public.ebooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY ebooks_staff ON public.ebooks
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- Public/anon may read only published entries — the homepage card and the
-- download-count bump both go through service-role server actions, never
-- direct anon writes.
CREATE POLICY ebooks_public_select ON public.ebooks
  FOR SELECT USING (published = true);
