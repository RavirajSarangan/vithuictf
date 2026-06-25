-- Admin CMS storage bucket (public read for marketing assets, admin-only write)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'admin',
  'admin',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY admin_storage_public_read ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'admin');

CREATE POLICY admin_storage_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'admin' AND public.is_admin());

CREATE POLICY admin_storage_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'admin' AND public.is_admin())
  WITH CHECK (bucket_id = 'admin' AND public.is_admin());

CREATE POLICY admin_storage_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'admin' AND public.is_admin());
