-- Compact footer logo: slightly larger than nav, left-aligned
UPDATE public.platform_settings
SET brand_logo_settings = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(brand_logo_settings, '{}'::jsonb),
        '{footer,widthRem}',
        '11.5'::jsonb
      ),
      '{footer,heightRem}',
      '3.25'::jsonb
    ),
    '{footer,widthRemSm}',
    '12.5'::jsonb
  ),
  '{footer,heightRemSm}',
  '3.5'::jsonb
)
WHERE id = 1;
