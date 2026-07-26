-- Global kill-switch for the public "Check Your Result" feature. Defaults to
-- off since this is a brand-new public data-exposure surface — a super admin
-- must explicitly opt in before the homepage CTA and lookup pages go live.
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS results_check_enabled BOOLEAN NOT NULL DEFAULT false;
