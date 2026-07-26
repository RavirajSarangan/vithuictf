-- Faculty Staff: a brand-new, fully isolated staff role/portal, independent
-- of the existing `teacher` role and the public `academic_staff` showcase
-- table. This migration only adds the role value + helper function; the
-- account table follows in a separate migration (a newly added enum value
-- cannot be used in the same transaction it was created in).

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'faculty_staff';

CREATE OR REPLACE FUNCTION public.is_faculty_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role::text = 'faculty_staff'
  );
$$;
