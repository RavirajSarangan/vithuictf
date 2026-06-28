-- Exam Paper Portal: paper center staff uploads + super admin review

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'paper_center_staff';

CREATE OR REPLACE FUNCTION public.is_paper_center_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role::text = 'paper_center_staff'
  );
$$;

CREATE TABLE public.paper_center_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  paper_center_id UUID NOT NULL REFERENCES public.paper_centers(id) ON DELETE RESTRICT,
  display_name TEXT NOT NULL,
  staff_username TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX paper_center_staff_username_lower_idx
  ON public.paper_center_staff (lower(staff_username));

CREATE INDEX paper_center_staff_user_id_idx ON public.paper_center_staff(user_id);
CREATE INDEX paper_center_staff_center_idx ON public.paper_center_staff(paper_center_id);
CREATE INDEX paper_center_staff_active_idx ON public.paper_center_staff(active);

CREATE TABLE public.exam_paper_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.paper_center_staff(id) ON DELETE RESTRICT,
  paper_center_id UUID NOT NULL REFERENCES public.paper_centers(id) ON DELETE RESTRICT,
  staff_name TEXT NOT NULL,
  center_name TEXT NOT NULL,
  place TEXT NOT NULL DEFAULT '',
  exam_year INT,
  medium public.pass_paper_medium,
  exam_type public.pass_paper_exam_type NOT NULL DEFAULT 'other',
  notes TEXT NOT NULL DEFAULT '',
  paper_count INT NOT NULL DEFAULT 0 CHECK (paper_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX exam_paper_batches_staff_idx ON public.exam_paper_batches(staff_id);
CREATE INDEX exam_paper_batches_center_idx ON public.exam_paper_batches(paper_center_id);
CREATE INDEX exam_paper_batches_created_idx ON public.exam_paper_batches(created_at DESC);

CREATE TABLE public.exam_paper_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.exam_paper_batches(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_index TEXT NOT NULL DEFAULT '',
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0 CHECK (file_size >= 0),
  mime_type TEXT NOT NULL DEFAULT 'application/pdf',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX exam_paper_submissions_batch_idx ON public.exam_paper_submissions(batch_id);

-- Storage bucket for uploaded exam papers (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exam-papers',
  'exam-papers',
  false,
  20971520,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE public.paper_center_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_paper_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_paper_submissions ENABLE ROW LEVEL SECURITY;

-- paper_center_staff
CREATE POLICY paper_center_staff_admin_all ON public.paper_center_staff
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE POLICY paper_center_staff_self_select ON public.paper_center_staff
  FOR SELECT USING (user_id = auth.uid());

-- exam_paper_batches: staff see own; super_admin sees all
CREATE POLICY exam_paper_batches_staff_select ON public.exam_paper_batches
  FOR SELECT USING (
    public.is_super_admin()
    OR staff_id IN (SELECT id FROM public.paper_center_staff WHERE user_id = auth.uid())
  );

CREATE POLICY exam_paper_batches_staff_insert ON public.exam_paper_batches
  FOR INSERT WITH CHECK (
    staff_id IN (
      SELECT id FROM public.paper_center_staff
      WHERE user_id = auth.uid() AND active = true
    )
  );

CREATE POLICY exam_paper_batches_super_admin_delete ON public.exam_paper_batches
  FOR DELETE USING (public.is_super_admin());

-- exam_paper_submissions
CREATE POLICY exam_paper_submissions_staff_select ON public.exam_paper_submissions
  FOR SELECT USING (
    public.is_super_admin()
    OR batch_id IN (
      SELECT b.id FROM public.exam_paper_batches b
      JOIN public.paper_center_staff s ON s.id = b.staff_id
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY exam_paper_submissions_staff_insert ON public.exam_paper_submissions
  FOR INSERT WITH CHECK (
    batch_id IN (
      SELECT b.id FROM public.exam_paper_batches b
      JOIN public.paper_center_staff s ON s.id = b.staff_id
      WHERE s.user_id = auth.uid() AND s.active = true
    )
  );

CREATE POLICY exam_paper_submissions_super_admin_delete ON public.exam_paper_submissions
  FOR DELETE USING (public.is_super_admin());

-- Storage policies
CREATE POLICY exam_papers_storage_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'exam-papers'
    AND (
      public.is_super_admin()
      OR (
        public.is_paper_center_staff()
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
    )
  );

CREATE POLICY exam_papers_storage_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'exam-papers'
    AND (
      public.is_super_admin()
      OR (
        public.is_paper_center_staff()
        AND (storage.foldername(name))[1] = auth.uid()::text
      )
    )
  );

CREATE POLICY exam_papers_storage_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'exam-papers'
    AND public.is_super_admin()
  );
