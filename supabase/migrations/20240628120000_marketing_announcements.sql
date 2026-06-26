-- Marketing announcement popups for public site

CREATE TABLE public.marketing_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  cta_label TEXT NOT NULL DEFAULT '',
  cta_url TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL DEFAULT 'text_only'
    CHECK (content_type IN ('image_only', 'text_only', 'text_image', 'text_image_link')),
  display_style TEXT NOT NULL DEFAULT 'card'
    CHECK (display_style IN ('minimal', 'card', 'image_hero', 'promo')),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  priority INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX marketing_announcements_active_schedule_idx
  ON public.marketing_announcements (is_active, priority DESC, created_at DESC);

ALTER TABLE public.marketing_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY marketing_announcements_public_read
  ON public.marketing_announcements FOR SELECT
  USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now())
  );

CREATE POLICY marketing_announcements_admin_write
  ON public.marketing_announcements FOR ALL
  USING (public.is_admin());
