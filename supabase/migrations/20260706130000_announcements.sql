-- Portal announcements: staff post to one or more batches (optional
-- attachment, pinnable) and students reply in a simple thread. Distinct from
-- marketing_announcements (public site banners) and from notifications, which
-- stays a pure per-user alert fan-out.

CREATE TABLE public.announcements (
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

CREATE TABLE public.announcement_batches (
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES public.course_batches(id) ON DELETE CASCADE,
  PRIMARY KEY (announcement_id, batch_id)
);

CREATE INDEX announcement_batches_batch_idx ON public.announcement_batches(batch_id);

CREATE TABLE public.announcement_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX announcement_replies_announcement_idx
  ON public.announcement_replies(announcement_id, created_at);

-- Private bucket; files are written with the admin client from server actions
-- and read only through signed URLs, so no storage.objects policies are added.
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('announcements', 'announcements', false, 20971520)
ON CONFLICT (id) DO NOTHING;

-- Visibility crosses RLS tables in both directions — helpers (recursion rule).
CREATE OR REPLACE FUNCTION public.staff_can_access_announcement(p_announcement_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin() OR EXISTS (
    SELECT 1 FROM public.announcement_batches ab
    WHERE ab.announcement_id = p_announcement_id
      AND public.staff_can_access_batch(ab.batch_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.user_can_view_announcement(p_announcement_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.staff_can_access_announcement(p_announcement_id) OR EXISTS (
    SELECT 1 FROM public.announcement_batches ab
    WHERE ab.announcement_id = p_announcement_id
      AND ab.batch_id IN (SELECT public.own_or_child_batch_ids())
  );
$$;

CREATE OR REPLACE FUNCTION public.is_announcement_author(p_announcement_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.announcements a
    WHERE a.id = p_announcement_id AND a.created_by = auth.uid()
  );
$$;

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY announcements_staff_select ON public.announcements
  FOR SELECT TO authenticated
  USING (public.staff_can_access_announcement(id) OR created_by = auth.uid());

CREATE POLICY announcements_author_insert ON public.announcements
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.is_staff());

CREATE POLICY announcements_author_admin_update ON public.announcements
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.is_admin())
  WITH CHECK (created_by = auth.uid() OR public.is_admin());

CREATE POLICY announcements_author_admin_delete ON public.announcements
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.is_admin());

CREATE POLICY announcements_student_parent_select ON public.announcements
  FOR SELECT TO authenticated
  USING (public.user_can_view_announcement(id));

CREATE POLICY announcement_batches_staff_all ON public.announcement_batches
  FOR ALL TO authenticated
  USING (public.staff_can_access_batch(batch_id))
  WITH CHECK (public.staff_can_access_batch(batch_id));

CREATE POLICY announcement_batches_student_select ON public.announcement_batches
  FOR SELECT TO authenticated
  USING (batch_id IN (SELECT public.own_or_child_batch_ids()));

CREATE POLICY announcement_replies_select ON public.announcement_replies
  FOR SELECT TO authenticated
  USING (public.user_can_view_announcement(announcement_id));

CREATE POLICY announcement_replies_insert ON public.announcement_replies
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND public.user_can_view_announcement(announcement_id)
  );

CREATE POLICY announcement_replies_delete ON public.announcement_replies
  FOR DELETE TO authenticated
  USING (
    author_id = auth.uid()
    OR public.is_admin()
    OR public.is_announcement_author(announcement_id)
  );
