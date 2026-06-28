-- Baseline follower counts from ICTF tracking spreadsheet (initial week seed)

DO $$
DECLARE
  v_week_start DATE;
  v_week_id UUID;
BEGIN
  v_week_start := (CURRENT_DATE - (EXTRACT(ISODOW FROM CURRENT_DATE)::INTEGER - 1))::DATE;

  INSERT INTO public.social_tracking_weeks (week_start)
  VALUES (v_week_start)
  ON CONFLICT (week_start) DO NOTHING;

  SELECT id INTO v_week_id
  FROM public.social_tracking_weeks
  WHERE week_start = v_week_start;

  IF v_week_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.social_follower_metrics (
    week_id,
    platform_id,
    previous_count,
    current_count,
    performance
  )
  SELECT
    v_week_id,
    p.id,
    v.count,
    v.count,
    'stable'::public.social_performance
  FROM public.social_platforms p
  INNER JOIN (
    VALUES
      ('youtube', 3416),
      ('facebook', 904),
      ('instagram', 609),
      ('tiktok', 116),
      ('whatsapp', 178)
  ) AS v(slug, count) ON p.slug = v.slug
  ON CONFLICT (week_id, platform_id) DO NOTHING;
END $$;
