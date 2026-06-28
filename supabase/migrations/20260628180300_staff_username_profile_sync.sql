-- Backfill missing staff usernames and align profile roles with active staff records
UPDATE public.teachers
SET staff_username = lower(regexp_replace(split_part(email, '@', 1), '[^a-z0-9_]', '', 'g'))
WHERE staff_username IS NULL OR trim(staff_username) = '';

UPDATE public.profiles AS p
SET role = 'teacher'
FROM public.teachers AS t
WHERE p.id = t.user_id
  AND coalesce(t.active, true) = true
  AND p.role IS DISTINCT FROM 'teacher';
