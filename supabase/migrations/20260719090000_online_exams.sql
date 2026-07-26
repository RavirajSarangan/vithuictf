-- Online exam portal: links an existing quiz (Part 1 MCQ, engine reused
-- unchanged) and an optional written paper (Part 2, view-only PDF + scanned
-- answer upload) to an `exams` row. Course-wide (batch_id may stay NULL,
-- exactly like quizzes.batch_id) so a Super Admin can assign one course and
-- have it auto-visible to every enrolled student via the existing
-- exams_student_parent_select policy.

ALTER TABLE public.exams
  ADD COLUMN quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL,
  ADD COLUMN is_online_exam BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN written_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN written_question_paper_path TEXT,
  ADD COLUMN written_question_paper_name TEXT,
  ADD COLUMN written_submission_deadline TIMESTAMPTZ;

-- One quiz can't silently back two different online exams.
CREATE UNIQUE INDEX exams_quiz_id_key ON public.exams(quiz_id) WHERE quiz_id IS NOT NULL;

-- Student /exams list query filters on this.
CREATE INDEX exams_online_idx ON public.exams(is_online_exam) WHERE is_online_exam;

CREATE TYPE public.exam_written_status AS ENUM ('submitted', 'reviewed', 'graded');

CREATE TABLE public.exam_written_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  status public.exam_written_status NOT NULL DEFAULT 'submitted',
  marks INT,
  feedback TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (exam_id, student_id)
);

CREATE INDEX exam_written_submissions_exam_idx ON public.exam_written_submissions(exam_id);
CREATE INDEX exam_written_submissions_student_idx ON public.exam_written_submissions(student_id);

-- Private bucket for admin-uploaded question papers. Scanned student answers
-- reuse the existing `submissions` bucket (from assignments) with an `exam/`
-- path prefix — security is fully signed-URL-mediated regardless of bucket.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('exam-question-papers', 'exam-question-papers', false, 20971520, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- exams has RLS itself, so exam_written_submissions policies must not query
-- it inline (recursion rule) — SECURITY DEFINER helpers, mirroring
-- staff_can_access_assignment / exam_is_published.
CREATE OR REPLACE FUNCTION public.staff_can_access_exam(p_exam_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.exams e
    WHERE e.id = p_exam_id AND public.teacher_can_access_course(e.course_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.exam_written_submission_open(p_exam_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.exams e
    WHERE e.id = p_exam_id AND e.is_online_exam AND e.written_enabled
      AND (e.written_submission_deadline IS NULL OR e.written_submission_deadline > now())
  );
$$;

ALTER TABLE public.exam_written_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY exam_written_submissions_staff_all ON public.exam_written_submissions
  FOR ALL TO authenticated
  USING (public.staff_can_access_exam(exam_id))
  WITH CHECK (public.staff_can_access_exam(exam_id));

CREATE POLICY exam_written_submissions_own_select ON public.exam_written_submissions
  FOR SELECT TO authenticated
  USING (student_id = public.own_student_id() OR public.is_parent_of(student_id));

CREATE POLICY exam_written_submissions_own_insert ON public.exam_written_submissions
  FOR INSERT TO authenticated
  WITH CHECK (student_id = public.own_student_id() AND public.exam_written_submission_open(exam_id));

-- Students may edit their upload only until staff has reviewed/graded it,
-- and only before the deadline — mirrors assignment_submissions_own_update.
CREATE POLICY exam_written_submissions_own_update ON public.exam_written_submissions
  FOR UPDATE TO authenticated
  USING (student_id = public.own_student_id() AND status = 'submitted')
  WITH CHECK (
    student_id = public.own_student_id() AND status = 'submitted'
    AND public.exam_written_submission_open(exam_id)
  );
