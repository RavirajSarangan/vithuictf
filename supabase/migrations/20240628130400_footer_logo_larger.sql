-- Larger footer logo defaults (left-aligned, prominent but not full-bleed)
UPDATE public.platform_settings
SET brand_logo_settings = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(brand_logo_settings, '{}'::jsonb),
        '{footer,widthRem}',
        '15'::jsonb
      ),
      '{footer,heightRem}',
      '5'::jsonb
    ),
    '{footer,widthRemSm}',
    '18'::jsonb
  ),
  '{footer,heightRemSm}',
  '6'::jsonb
)
WHERE id = 1;
