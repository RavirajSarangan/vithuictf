-- Per-staff granular feature toggles, layered on top of the existing
-- role-based access model. Default-allow: absence of a row means "allowed"
-- (today's behavior, unchanged) — a row only ever exists to explicitly
-- DISABLE one feature area for one specific teacher. This is deliberate:
-- every teacher currently has full academics access, so a default-deny
-- model would lock everyone out the moment this migration lands.

CREATE TYPE public.staff_feature_key AS ENUM (
  'quizzes_exams',
  'assignments',
  'attendance_students',
  'announcements_report_cards'
);

CREATE TABLE public.staff_feature_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  feature_key public.staff_feature_key NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, feature_key)
);

CREATE INDEX staff_feature_permissions_user_id_idx ON public.staff_feature_permissions(user_id);

ALTER TABLE public.staff_feature_permissions ENABLE ROW LEVEL SECURITY;

-- Super admin manages everything.
CREATE POLICY staff_feature_permissions_super_admin_all ON public.staff_feature_permissions
FOR ALL USING (public.is_super_admin());

-- A teacher may read their own rows (needed to hide disabled nav items client-side).
CREATE POLICY staff_feature_permissions_own_select ON public.staff_feature_permissions
FOR SELECT USING (user_id = auth.uid());
