-- Promote an existing user to admin (run in Supabase SQL Editor after they register)
-- Replace the email with your admin account email.

UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@ictf.lk';

-- Verify:
-- SELECT id, email, role FROM public.profiles WHERE email = 'admin@ictf.lk';
