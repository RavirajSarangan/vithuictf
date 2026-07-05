-- Homework & assignments: staff post assignments per batch, students submit
-- files, staff grade with marks + feedback. Files live in private buckets and
-- are only delivered through signed URLs (no client storage policies).

CREATE TYPE public.submission_status AS ENUM ('submitted', 'graded', 'returned');

CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.course_batches(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  instructions TEXT NOT NULL DEFAULT '',
  attachment_path TEXT,
  attachment_name TEXT,
  due_at TIMESTAMPTZ NOT NULL,
  max_marks INT NOT NULL DEFAULT 100 CHECK (max_marks > 0),
  published BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX assignments_batch_idx ON public.assignments(batch_id, due_at);
CREATE INDEX assignments_course_idx ON public.assignments(course_id);

CREATE TABLE public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  file_path TEXT,
  file_name TEXT,
  note TEXT NOT NULL DEFAULT '',
  status public.submission_status NOT NULL DEFAULT 'submitted',
  marks INT,
  feedback TEXT,
  graded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  graded_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, student_id)
);

CREATE INDEX assignment_submissions_assignment_idx ON public.assignment_submissions(assignment_id);
CREATE INDEX assignment_submissions_student_idx ON public.assignment_submissions(student_id);

-- Private buckets; files are written with the admin client from server actions
-- and read only through signed URLs, so no storage.objects policies are added.
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('assignments', 'assignments', false, 20971520),
  ('submissions', 'submissions', false, 20971520)
ON CONFLICT (id) DO NOTHING;

-- Staff scoping via SECURITY DEFINER helper (assignments has RLS itself, so
-- submissions policies must not query it inline — recursion rule).
CREATE OR REPLACE FUNCTION public.staff_can_access_assignment(p_assignment_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.assignments a
    WHERE a.id = p_assignment_id AND public.staff_can_access_batch(a.batch_id)
  );
$$;

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY assignments_staff_all ON public.assignments
  FOR ALL TO authenticated
  USING (public.staff_can_access_batch(batch_id))
  WITH CHECK (public.staff_can_access_batch(batch_id));

CREATE POLICY assignments_student_parent_select ON public.assignments
  FOR SELECT TO authenticated
  USING (published AND batch_id IN (SELECT public.own_or_child_batch_ids()));

CREATE POLICY assignment_submissions_staff_all ON public.assignment_submissions
  FOR ALL TO authenticated
  USING (public.staff_can_access_assignment(assignment_id))
  WITH CHECK (public.staff_can_access_assignment(assignment_id));

CREATE POLICY assignment_submissions_own_select ON public.assignment_submissions
  FOR SELECT TO authenticated
  USING (
    student_id = public.own_student_id()
    OR public.is_parent_of(student_id)
  );

CREATE POLICY assignment_submissions_own_insert ON public.assignment_submissions
  FOR INSERT TO authenticated
  WITH CHECK (student_id = public.own_student_id());

-- Students may edit a submission only until it is graded.
CREATE POLICY assignment_submissions_own_update ON public.assignment_submissions
  FOR UPDATE TO authenticated
  USING (student_id = public.own_student_id() AND status = 'submitted')
  WITH CHECK (student_id = public.own_student_id() AND status = 'submitted');
