-- Add "blog" as a fifth toggleable staff feature area, so super admins can
-- grant/revoke individual teachers access to blog management from
-- /academics/blog (reusing the same feature-toggle system that already
-- gates Quizzes/Exams, Assignments, Attendance, Announcements/Report Cards).

ALTER TYPE public.staff_feature_key ADD VALUE IF NOT EXISTS 'blog';
