-- Allow super_admin to access social tracking tables (matches requireTrackingStaff in app)

CREATE OR REPLACE FUNCTION public.is_tracking_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'content_manager')
  );
$$;
