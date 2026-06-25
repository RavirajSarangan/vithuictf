-- Storage bucket + RLS for protected resources
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resources',
  'resources',
  false,
  52428800,
  ARRAY['application/pdf', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can read resources (signed URLs still recommended)
CREATE POLICY resources_storage_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'resources');

-- Staff can upload/update
CREATE POLICY resources_storage_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resources' AND public.is_staff());

CREATE POLICY resources_storage_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'resources' AND public.is_staff())
  WITH CHECK (bucket_id = 'resources' AND public.is_staff());

CREATE POLICY resources_storage_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'resources' AND public.is_admin());
