-- Faculty portal announcements: faculty staff post to one or more
-- faculty_batches (optional attachment, pinnable) and students/parents reply
-- in a simple thread. Fully isolated clone of
-- 20260706130000_announcements.sql's announcements/announcement_batches/
-- announcement_replies for the faculty_staff portal — faculty_* tables,
-- faculty_* helper functions (built on faculty_can_access_batch /
-- own_or_child_faculty_batch_ids from 20260726091000_faculty_academics_batches.sql),
-- so faculty data stays on its own tables end to end, same as the rest of
-- this build.

CREATE TABLE public.faculty_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  attachment_path TEXT,
  attachment_name TEXT,
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.faculty_announcement_batches (
  announcement_id UUID NOT NULL REFERENCES public.faculty_announcements(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES public.faculty_batches(id) ON DELETE CASCADE,
  PRIMARY KEY (announcement_id, batch_id)
);

CREATE INDEX faculty_announcement_batches_batch_idx ON public.faculty_announcement_batches(batch_id);

CREATE TABLE public.faculty_announcement_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.faculty_announcements(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX faculty_announcement_replies_announcement_idx
  ON public.faculty_announcement_replies(announcement_id, created_at);

-- No new storage bucket: the "announcements" bucket already exists (see
-- 20260706130000_announcements.sql), is private, and has no storage.objects
-- RLS policies — writes go through the admin client from server actions and
-- reads only through signed URLs minted after an RLS-backed visibility
-- check. Faculty attachments reuse the same bucket under a "faculty/"
-- foldername prefix (enforced at the application layer in
-- src/lib/actions/faculty-announcements.ts), so no policy changes are
-- needed here.

-- Visibility crosses RLS tables in both directions — helpers (recursion rule).
CREATE OR REPLACE FUNCTION public.faculty_staff_can_access_announcement(p_announcement_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin() OR EXISTS (
    SELECT 1 FROM public.faculty_announcement_batches ab
    WHERE ab.announcement_id = p_announcement_id
      AND public.faculty_can_access_batch(ab.batch_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.faculty_user_can_view_announcement(p_announcement_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.faculty_staff_can_access_announcement(p_announcement_id) OR EXISTS (
    SELECT 1 FROM public.faculty_announcement_batches ab
    WHERE ab.announcement_id = p_announcement_id
      AND ab.batch_id IN (SELECT public.own_or_child_faculty_batch_ids())
  );
$$;

CREATE OR REPLACE FUNCTION public.faculty_is_announcement_author(p_announcement_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.faculty_announcements a
    WHERE a.id = p_announcement_id AND a.created_by = auth.uid()
  );
$$;

ALTER TABLE public.faculty_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_announcement_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_announcement_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY faculty_announcements_staff_select ON public.faculty_announcements
  FOR SELECT TO authenticated
  USING (public.faculty_staff_can_access_announcement(id) OR created_by = auth.uid());

-- is_faculty_staff() only covers the faculty_staff role; is_admin() is added
-- explicitly so admin/super_admin can also post, mirroring the original
-- policy's effective behavior (its is_staff() already includes admin/super_admin).
CREATE POLICY faculty_announcements_author_insert ON public.faculty_announcements
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND (public.is_faculty_staff() OR public.is_admin()));

CREATE POLICY faculty_announcements_author_admin_update ON public.faculty_announcements
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.is_admin())
  WITH CHECK (created_by = auth.uid() OR public.is_admin());

CREATE POLICY faculty_announcements_author_admin_delete ON public.faculty_announcements
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.is_admin());

CREATE POLICY faculty_announcements_student_parent_select ON public.faculty_announcements
  FOR SELECT TO authenticated
  USING (public.faculty_user_can_view_announcement(id));

CREATE POLICY faculty_announcement_batches_staff_all ON public.faculty_announcement_batches
  FOR ALL TO authenticated
  USING (public.faculty_can_access_batch(batch_id))
  WITH CHECK (public.faculty_can_access_batch(batch_id));

CREATE POLICY faculty_announcement_batches_student_select ON public.faculty_announcement_batches
  FOR SELECT TO authenticated
  USING (batch_id IN (SELECT public.own_or_child_faculty_batch_ids()));

CREATE POLICY faculty_announcement_replies_select ON public.faculty_announcement_replies
  FOR SELECT TO authenticated
  USING (public.faculty_user_can_view_announcement(announcement_id));

CREATE POLICY faculty_announcement_replies_insert ON public.faculty_announcement_replies
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND public.faculty_user_can_view_announcement(announcement_id)
  );

CREATE POLICY faculty_announcement_replies_delete ON public.faculty_announcement_replies
  FOR DELETE TO authenticated
  USING (
    author_id = auth.uid()
    OR public.is_admin()
    OR public.faculty_is_announcement_author(announcement_id)
  );
