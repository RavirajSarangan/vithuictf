-- Home-page display controls for courses + auto-derived class-day schedule.

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS show_on_home BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

-- Backfill a stable initial ordering by creation time.
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM public.courses
)
UPDATE public.courses c
SET sort_order = ranked.rn
FROM ranked
WHERE c.id = ranked.id
  AND c.sort_order = 0;

-- Aggregated schedule per course. The view runs with owner rights (bypassing
-- course_batches RLS, which is staff-only) and exposes ONLY the course id and
-- the union of class days across active batches, so anon can read it safely.
CREATE OR REPLACE VIEW public.course_schedule_summaries AS
SELECT
  b.course_id,
  COUNT(DISTINCT d.day)::int AS class_days_per_week,
  ARRAY_AGG(DISTINCT d.day) AS class_days
FROM public.course_batches b
CROSS JOIN LATERAL UNNEST(b.class_days) AS d(day)
WHERE b.active
GROUP BY b.course_id;

GRANT SELECT ON public.course_schedule_summaries TO anon, authenticated;
