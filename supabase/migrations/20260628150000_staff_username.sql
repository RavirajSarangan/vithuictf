-- Staff portal login username (separate from student username)
ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS staff_username text;

UPDATE public.teachers
SET staff_username = lower(regexp_replace(split_part(email, '@', 1), '[^a-z0-9_]', '', 'g'))
WHERE staff_username IS NULL OR staff_username = '';

CREATE UNIQUE INDEX IF NOT EXISTS teachers_staff_username_lower_idx
  ON public.teachers (lower(staff_username))
  WHERE staff_username IS NOT NULL AND staff_username <> '';
