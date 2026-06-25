-- Restore homepage Coming Soon overlay (sections below hero)
UPDATE public.platform_settings
SET marketing_coming_soon_enabled = true
WHERE id = 1;
