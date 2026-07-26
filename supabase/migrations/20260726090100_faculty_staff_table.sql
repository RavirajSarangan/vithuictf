-- Faculty Staff account table: modeled directly on public.paper_center_staff
-- (self-contained parallel-portal pattern), not on public.teachers, so this
-- role stays fully isolated from teacher/admin merge logic.

CREATE TABLE public.faculty_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  staff_username TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  subjects TEXT[] NOT NULL DEFAULT '{}',
  course_ids UUID[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX faculty_staff_username_lower_idx
  ON public.faculty_staff (lower(staff_username));

CREATE INDEX faculty_staff_user_id_idx ON public.faculty_staff(user_id);
CREATE INDEX faculty_staff_active_idx ON public.faculty_staff(active);

ALTER TABLE public.faculty_staff ENABLE ROW LEVEL SECURITY;

-- Admin/super_admin manage faculty_staff accounts (matches how `teachers` is
-- managed today — not restricted to super_admin only, unlike paper_center_staff).
CREATE POLICY faculty_staff_admin_all ON public.faculty_staff
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY faculty_staff_self_select ON public.faculty_staff
  FOR SELECT USING (user_id = auth.uid());
