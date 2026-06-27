-- Compact nav wordmark + no upscale — fits h-16 pill without dead space
UPDATE public.platform_settings
SET brand_logo_settings = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            COALESCE(brand_logo_settings, '{}'::jsonb),
            '{nav,widthRem}',
            '4.25'::jsonb
          ),
          '{nav,heightRem}',
          '1.875'::jsonb
        ),
        '{nav,widthRemSm}',
        '4'::jsonb
      ),
      '{nav,heightRemSm}',
      '1.75'::jsonb
    ),
    '{nav,scale}',
    '1'::jsonb
  ),
  '{nav,scaleSm}',
  '1'::jsonb
)
WHERE id = 1;
