-- Larger default nav/footer logo sizes for clearer visibility
UPDATE public.platform_settings
SET brand_logo_settings = '{
  "nav": { "widthRem": 12.5, "scale": 1.34, "scaleSm": 1.4 },
  "footer": { "widthRem": 20, "heightRem": 6.25, "widthRemSm": 22, "heightRemSm": 6.75 }
}'::jsonb
WHERE id = 1;
