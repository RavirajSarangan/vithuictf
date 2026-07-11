-- Extend the anon-safe course schedule view with class times and session
-- progress so the public home cards can show "4:00 – 6:00 PM" and "12/24
-- sessions". Still exposes only per-course aggregates — no student data.

CREATE OR REPLACE VIEW public.course_schedule_summaries AS
WITH batch_days AS (
  SELECT
    b.course_id,
    COUNT(DISTINCT d.day)::int AS class_days_per_week,
    ARRAY_AGG(DISTINCT d.day) AS class_days
  FROM public.course_batches b
  CROSS JOIN LATERAL UNNEST(b.class_days) AS d(day)
  WHERE b.active
  GROUP BY b.course_id
),
-- Time of the most recently started active batch.
batch_times AS (
  SELECT DISTINCT ON (course_id) course_id, start_time, end_time
  FROM public.course_batches
  WHERE active
  ORDER BY course_id, start_date DESC
),
-- Session progress summed across all active batches. A session counts as
-- completed once staff mark it, or once its date has passed while still
-- "scheduled" (so the public count doesn't stall on unmarked sessions).
session_counts AS (
  SELECT
    b.course_id,
    COUNT(s.id)::int AS total_sessions,
    COUNT(s.id) FILTER (
      WHERE s.status = 'completed'
         OR (s.status = 'scheduled'
             AND s.scheduled_date < (now() AT TIME ZONE 'Asia/Colombo')::date)
    )::int AS completed_sessions
  FROM public.course_batches b
  JOIN public.class_sessions s ON s.batch_id = b.id
  WHERE b.active
  GROUP BY b.course_id
)
SELECT
  bd.course_id,
  bd.class_days_per_week,
  bd.class_days,
  bt.start_time,
  bt.end_time,
  COALESCE(sc.total_sessions, 0) AS total_sessions,
  COALESCE(sc.completed_sessions, 0) AS completed_sessions
FROM batch_days bd
LEFT JOIN batch_times bt USING (course_id)
LEFT JOIN session_counts sc USING (course_id);

GRANT SELECT ON public.course_schedule_summaries TO anon, authenticated;
