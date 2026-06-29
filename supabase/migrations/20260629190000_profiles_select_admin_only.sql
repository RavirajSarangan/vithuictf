-- Teachers should not enumerate all staff/admin profiles via RLS.
-- Admins retain full access via profiles_admin_all; teachers see only their own row.

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;

CREATE POLICY profiles_select_own ON public.profiles
FOR SELECT
USING (id = auth.uid() OR public.is_admin());
