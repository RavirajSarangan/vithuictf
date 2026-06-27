-- Medium nav wordmark on mobile header (fits h-16 pill)
UPDATE public.platform_settings
SET brand_logo_settings = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            COALESCE(brand_logo_settings, '{}'::jsonb),
            '{nav,widthRem}',
            '5.5'::jsonb
          ),
          '{nav,heightRem}',
          '2.5'::jsonb
        ),
        '{nav,widthRemSm}',
        '7.5'::jsonb
      ),
      '{nav,heightRemSm}',
      '3'::jsonb
    ),
    '{nav,scale}',
    '1.08'::jsonb
  ),
  '{nav,scaleSm}',
  '1.12'::jsonb
)
WHERE id = 1;
