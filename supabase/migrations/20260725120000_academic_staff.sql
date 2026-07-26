-- Academic Staff: public-facing academic staff profiles managed by super admins

CREATE TABLE IF NOT EXISTS public.academic_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  affiliate TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  photo_url TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS academic_staff_sort_order_idx
  ON public.academic_staff (sort_order);

ALTER TABLE public.academic_staff ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous marketing visitors) can read active staff profiles
CREATE POLICY academic_staff_public ON public.academic_staff
  FOR SELECT USING (is_active = true);

-- Only super admins can create, edit, or delete staff profiles
CREATE POLICY academic_staff_super_admin_write ON public.academic_staff
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
