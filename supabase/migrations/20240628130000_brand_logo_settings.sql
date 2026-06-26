-- Admin-managed marketing nav & footer logo dimensions
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS brand_logo_settings JSONB NOT NULL DEFAULT '{
    "nav": { "widthRem": 10.75, "scale": 1.22, "scaleSm": 1.26 },
    "footer": { "widthRem": 13.5, "heightRem": 4.25, "widthRemSm": 14, "heightRemSm": 4.5 }
  }'::jsonb;
