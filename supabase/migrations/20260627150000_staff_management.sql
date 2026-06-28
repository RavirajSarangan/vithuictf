-- Staff management: teacher active flag + admin-only teacher writes
ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

DROP POLICY IF EXISTS teachers_staff_write ON public.teachers;
CREATE POLICY teachers_admin_write ON public.teachers
  FOR ALL USING (public.is_admin());
