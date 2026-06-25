-- Promote an existing user to teacher (run in Supabase SQL Editor after they register)
-- Replace the email with the teacher account email.

UPDATE public.profiles
SET role = 'teacher'
WHERE email = 'teacher@ictf.lk';

-- Verify:
-- SELECT id, email, role FROM public.profiles WHERE email = 'teacher@ictf.lk';
