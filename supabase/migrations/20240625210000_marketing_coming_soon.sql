-- Admin toggle: blur homepage sections below hero with "Coming Soon" overlay
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS marketing_coming_soon_enabled BOOLEAN NOT NULL DEFAULT true;

UPDATE public.platform_settings
SET marketing_coming_soon_enabled = true
WHERE id = 1;
