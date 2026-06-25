-- Site-wide public mode: live, coming_soon, or maintenance (admin-controlled)
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS site_public_mode TEXT NOT NULL DEFAULT 'live'
  CHECK (site_public_mode IN ('live', 'coming_soon', 'maintenance'));

UPDATE public.platform_settings
SET site_public_mode = 'live'
WHERE id = 1;
