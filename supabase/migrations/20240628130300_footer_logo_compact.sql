-- Compact footer logo: smaller size, left-aligned with brand copy
UPDATE public.platform_settings
SET brand_logo_settings = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(brand_logo_settings, '{}'::jsonb),
        '{footer,widthRem}',
        '11'::jsonb
      ),
      '{footer,heightRem}',
      '3.5'::jsonb
    ),
    '{footer,widthRemSm}',
    '12.5'::jsonb
  ),
  '{footer,heightRemSm}',
  '4'::jsonb
)
WHERE id = 1;
