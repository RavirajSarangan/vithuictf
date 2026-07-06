-- Exams & report cards: staff schedule exams per batch and enter marks in
-- bulk; marks stay hidden from students/parents until the exam is published.
-- Term report cards are gated per (batch, term) via report_card_publications.
--
-- Extends the legacy exams/results tables instead of adding new marks tables:
-- legacy exams keep batch_id NULL, legacy results keep exam_id NULL and remain
-- visible to their students unchanged.

CREATE TYPE public.exam_status AS ENUM ('scheduled', 'grading', 'published');

ALTER TABLE public.exams
  ADD COLUMN batch_id UUID REFERENCES public.course_batches(id) ON DELETE CASCADE,
  ADD COLUMN subject TEXT NOT NULL DEFAULT '',
  ADD COLUMN total_marks INT NOT NULL DEFAULT 100 CHECK (total_marks > 0),
  ADD COLUMN term TEXT NOT NULL DEFAULT 'Term 1',
  ADD COLUMN weight NUMERIC(5,2) NOT NULL DEFAULT 1 CHECK (weight > 0),
  ADD COLUMN start_time TIME,
  ADD COLUMN status public.exam_status NOT NULL DEFAULT 'scheduled',
  ADD COLUMN published_at TIMESTAMPTZ,
  ADD COLUMN created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX exams_batch_idx ON public.exams(batch_id, exam_date);
CREATE INDEX exams_course_idx ON public.exams(course_id, exam_date);

ALTER TABLE public.results
  ADD COLUMN entered_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Upsert key for staff mark entry. Not partial: PostgREST ON CONFLICT cannot
-- target partial indexes, and NULL exam_id rows (legacy) stay unconstrained
-- because NULLs are distinct.
CREATE UNIQUE INDEX results_exam_student_subject_key
  ON public.results(exam_id, student_id, subject);

-- Deleting a batch exam removes its marks; legacy NULL rows are unaffected.
ALTER TABLE public.results DROP CONSTRAINT results_exam_id_fkey;
ALTER TABLE public.results ADD CONSTRAINT results_exam_id_fkey
  FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;

-- results policies must not read exams inline (recursion rule) — helper.
CREATE OR REPLACE FUNCTION public.exam_is_published(p_exam_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.exams e
    WHERE e.id = p_exam_id AND e.status = 'published'
  );
$$;

DROP POLICY exams_select ON public.exams;
DROP POLICY exams_staff_write ON public.exams;

CREATE POLICY exams_staff_all ON public.exams
  FOR ALL TO authenticated
  USING (public.teacher_can_access_course(course_id))
  WITH CHECK (public.teacher_can_access_course(course_id));

CREATE POLICY exams_student_parent_select ON public.exams
  FOR SELECT TO authenticated
  USING (
    batch_id IN (SELECT public.own_or_child_batch_ids())
    OR (batch_id IS NULL AND course_id IN (SELECT public.student_enrolled_course_ids()))
  );

-- Students/parents only see marks once the exam is published; legacy rows
-- (exam_id NULL) stay visible. Staff read/write is unchanged.
DROP POLICY results_select ON public.results;

CREATE POLICY results_select ON public.results
  FOR SELECT USING (
    public.is_staff()
    OR (
      (student_id = public.own_student_id() OR public.is_parent_of(student_id))
      AND (exam_id IS NULL OR public.exam_is_published(exam_id))
    )
  );

CREATE TABLE public.report_card_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.course_batches(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  UNIQUE (batch_id, term)
);

ALTER TABLE public.report_card_publications ENABLE ROW LEVEL SECURITY;

CREATE POLICY report_card_publications_staff_all ON public.report_card_publications
  FOR ALL TO authenticated
  USING (public.staff_can_access_batch(batch_id))
  WITH CHECK (public.staff_can_access_batch(batch_id));

CREATE POLICY report_card_publications_student_select ON public.report_card_publications
  FOR SELECT TO authenticated
  USING (batch_id IN (SELECT public.own_or_child_batch_ids()));
