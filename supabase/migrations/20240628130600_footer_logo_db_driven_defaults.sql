-- Footer/nav logo sizes controlled via platform_settings.brand_logo_settings
-- (admin panel + CSS variables). Replaces compact overrides from prior migrations.
UPDATE public.platform_settings
SET brand_logo_settings = '{
  "nav": { "widthRem": 12.5, "scale": 1.05, "scaleSm": 1.1 },
  "footer": { "widthRem": 17, "heightRem": 5, "widthRemSm": 19, "heightRemSm": 5.5 }
}'::jsonb
WHERE id = 1;
