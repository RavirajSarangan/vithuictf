-- Scope resources to enrolled courses; staff retain full access.
-- Students access file bytes via signed URLs from the API route (service role).

DROP POLICY IF EXISTS resources_select ON public.resources;

CREATE POLICY resources_select ON public.resources
FOR SELECT TO authenticated
USING (
  public.is_staff()
  OR course_id IS NULL
  OR course_id IN (SELECT public.student_enrolled_course_ids())
);

-- Storage: only staff read objects directly; students use API-signed URLs.
DROP POLICY IF EXISTS resources_storage_select ON storage.objects;

CREATE POLICY resources_storage_select ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'resources' AND public.is_staff());
