-- Drop the existing constraint and recreate it to support the new 'banner' display style.
ALTER TABLE public.marketing_announcements
  DROP CONSTRAINT IF EXISTS marketing_announcements_display_style_check;

ALTER TABLE public.marketing_announcements
  ADD CONSTRAINT marketing_announcements_display_style_check
  CHECK (display_style IN ('minimal', 'card', 'image_hero', 'promo', 'banner'));
