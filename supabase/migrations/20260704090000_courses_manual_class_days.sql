-- Admin-managed class days directly on courses. Used by the marketing cards
-- whenever a course has no active batches yet; batch-derived days (via
-- course_schedule_summaries) take precedence once batches exist.

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS class_days TEXT[] NOT NULL DEFAULT '{}';
