-- Faculty portal clone of the teacher-side homework/assignments subsystem
-- (see 20260705100000_assignments.sql for the original). Fully isolated:
-- faculty_assignments/faculty_assignment_submissions are separate tables,
-- FK'd to faculty_batches (not course_batches). The public.submission_status
-- enum is shared/reused as-is — it's a plain value type, not a scoped table.
--
-- Storage: no new buckets. Faculty files reuse the existing private
-- 'assignments'/'submissions' buckets created by the teacher-side migration,
-- written under a `faculty/` path prefix by the server actions (admin client
-- only, same as the original — no storage.objects policies exist for these
-- buckets and none are added here).

CREATE TABLE public.faculty_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.faculty_batches(id) ON DELETE CASCADE,
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

CREATE INDEX faculty_assignments_batch_idx ON public.faculty_assignments(batch_id, due_at);
CREATE INDEX faculty_assignments_course_idx ON public.faculty_assignments(course_id);

CREATE TABLE public.faculty_assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.faculty_assignments(id) ON DELETE CASCADE,
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

CREATE INDEX faculty_assignment_submissions_assignment_idx ON public.faculty_assignment_submissions(assignment_id);
CREATE INDEX faculty_assignment_submissions_student_idx ON public.faculty_assignment_submissions(student_id);

-- Faculty-scoped mirror of public.staff_can_access_assignment: SECURITY
-- DEFINER indirection so evaluating faculty_assignment_submissions RLS never
-- re-enters faculty_assignments RLS (recursion-avoidance pattern used
-- throughout the faculty backbone — see faculty_can_access_batch/session).
CREATE OR REPLACE FUNCTION public.faculty_staff_can_access_assignment(p_assignment_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.faculty_assignments a
    WHERE a.id = p_assignment_id AND public.faculty_can_access_batch(a.batch_id)
  );
$$;

ALTER TABLE public.faculty_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_assignment_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY faculty_assignments_staff_all ON public.faculty_assignments
  FOR ALL TO authenticated
  USING (public.faculty_can_access_batch(batch_id))
  WITH CHECK (public.faculty_can_access_batch(batch_id));

CREATE POLICY faculty_assignments_student_parent_select ON public.faculty_assignments
  FOR SELECT TO authenticated
  USING (published AND batch_id IN (SELECT public.own_or_child_faculty_batch_ids()));

CREATE POLICY faculty_assignment_submissions_staff_all ON public.faculty_assignment_submissions
  FOR ALL TO authenticated
  USING (public.faculty_staff_can_access_assignment(assignment_id))
  WITH CHECK (public.faculty_staff_can_access_assignment(assignment_id));

CREATE POLICY faculty_assignment_submissions_own_select ON public.faculty_assignment_submissions
  FOR SELECT TO authenticated
  USING (
    student_id = public.own_student_id()
    OR public.is_parent_of(student_id)
  );

CREATE POLICY faculty_assignment_submissions_own_insert ON public.faculty_assignment_submissions
  FOR INSERT TO authenticated
  WITH CHECK (student_id = public.own_student_id());

-- Students may edit a submission only until it is graded.
CREATE POLICY faculty_assignment_submissions_own_update ON public.faculty_assignment_submissions
  FOR UPDATE TO authenticated
  USING (student_id = public.own_student_id() AND status = 'submitted')
  WITH CHECK (student_id = public.own_student_id() AND status = 'submitted');
