-- Remove attendance feature entirely

DROP POLICY IF EXISTS attendance_select ON public.attendance;
DROP POLICY IF EXISTS attendance_staff_write ON public.attendance;
DROP TABLE IF EXISTS public.attendance;

ALTER TABLE public.students DROP COLUMN IF EXISTS attendance_pct;

DELETE FROM public.achievements WHERE badge_id = 'perfect-attendance';
DELETE FROM public.badge_definitions WHERE id = 'perfect-attendance';

UPDATE public.notifications SET type = 'announcement' WHERE type = 'attendance';

ALTER TYPE public.notification_type RENAME TO notification_type_old;
CREATE TYPE public.notification_type AS ENUM ('result', 'announcement', 'achievement');
ALTER TABLE public.notifications
  ALTER COLUMN type TYPE public.notification_type
  USING (
    CASE type::text
      WHEN 'attendance' THEN 'announcement'::public.notification_type
      ELSE type::text::public.notification_type
    END
  );
DROP TYPE public.notification_type_old;
DROP TYPE IF EXISTS public.attendance_status;

UPDATE public.faqs SET answer = 'Yes! Parents have a dedicated portal to view performance reports and receive real-time notifications.'
WHERE question = 'Can parents monitor student progress?';

UPDATE public.faqs SET answer = 'Points are earned through resource engagement, exam performance, and achievements. Top performers are ranked per course.'
WHERE question = 'How does the leaderboard work?';

UPDATE public.success_stories SET review = 'The past papers and progress tracking made all the difference. I could see my improvement clearly.'
WHERE name = 'Kavindu Perera';
