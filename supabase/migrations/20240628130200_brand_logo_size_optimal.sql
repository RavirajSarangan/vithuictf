-- Optimal default logo sizes for header/footer visibility
UPDATE public.platform_settings
SET brand_logo_settings = '{
  "nav": { "widthRem": 13.75, "scale": 1.38, "scaleSm": 1.44 },
  "footer": { "widthRem": 19, "heightRem": 7.5, "widthRemSm": 24, "heightRemSm": 8 }
}'::jsonb
WHERE id = 1;

-- Enable Realtime for live logo size updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'platform_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_settings;
  END IF;
END $$;
