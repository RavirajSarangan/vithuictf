-- Faculty academics: batches, enrollments, class sessions — the shared
-- backbone every faculty subsystem (attendance, assignments, quizzes, exams,
-- announcements, report cards) depends on. Fully isolated from the teacher
-- side (public.course_batches / public.teachers): faculty data uses its own
-- tables and its own access-control helpers throughout.

CREATE TABLE public.faculty_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  batch_code TEXT NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '12:00',
  class_days TEXT[] NOT NULL DEFAULT '{}',
  total_classes INT NOT NULL DEFAULT 10 CHECK (total_classes > 0 AND total_classes <= 52),
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX faculty_batches_course_id_idx ON public.faculty_batches(course_id);
CREATE INDEX faculty_batches_active_idx ON public.faculty_batches(active);

CREATE TABLE public.faculty_batch_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.faculty_batches(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  enrollment_code TEXT NOT NULL UNIQUE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (batch_id, student_id)
);

CREATE INDEX faculty_batch_enrollments_batch_idx ON public.faculty_batch_enrollments(batch_id);
CREATE INDEX faculty_batch_enrollments_student_idx ON public.faculty_batch_enrollments(student_id);

CREATE TABLE public.faculty_class_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.faculty_batches(id) ON DELETE CASCADE,
  session_number INT NOT NULL CHECK (session_number > 0),
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status public.class_session_status NOT NULL DEFAULT 'scheduled',
  UNIQUE (batch_id, session_number)
);

CREATE INDEX faculty_class_sessions_batch_idx ON public.faculty_class_sessions(batch_id);

-- Faculty-scoped course access helper (mirrors teacher_can_access_course, but
-- keyed off public.faculty_staff.course_ids instead of public.teachers).
CREATE OR REPLACE FUNCTION public.faculty_can_access_course(p_course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.faculty_staff f
      WHERE f.user_id = auth.uid()
        AND p_course_id = ANY(COALESCE(f.course_ids, '{}'))
    );
$$;

-- SECURITY DEFINER indirection so evaluating one table's RLS never re-enters
-- another table's RLS (same recursion-avoidance pattern as
-- staff_can_access_batch/staff_can_access_session for the teacher side).
CREATE OR REPLACE FUNCTION public.faculty_can_access_batch(p_batch_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.faculty_batches b
    WHERE b.id = p_batch_id AND public.faculty_can_access_course(b.course_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.faculty_can_access_session(p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.faculty_class_sessions s
    JOIN public.faculty_batches b ON b.id = s.batch_id
    WHERE s.id = p_session_id AND public.faculty_can_access_course(b.course_id)
  );
$$;

-- Batch ids visible to the current student or parent, resolved with definer
-- rights so it never evaluates faculty_batch_enrollments RLS.
CREATE OR REPLACE FUNCTION public.own_or_child_faculty_batch_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT be.batch_id
  FROM public.faculty_batch_enrollments be
  WHERE be.active = true
    AND (
      be.student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
      OR public.is_parent_of(be.student_id)
    );
$$;

ALTER TABLE public.faculty_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_batch_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_class_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY faculty_batches_staff_all ON public.faculty_batches
  FOR ALL USING (public.faculty_can_access_course(course_id))
  WITH CHECK (public.faculty_can_access_course(course_id));

CREATE POLICY faculty_batches_student_parent_select ON public.faculty_batches
  FOR SELECT USING (id IN (SELECT public.own_or_child_faculty_batch_ids()));

CREATE POLICY faculty_batch_enrollments_staff_all ON public.faculty_batch_enrollments
  FOR ALL USING (public.faculty_can_access_batch(batch_id))
  WITH CHECK (public.faculty_can_access_batch(batch_id));

CREATE POLICY faculty_batch_enrollments_own_select ON public.faculty_batch_enrollments
  FOR SELECT USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    OR public.is_parent_of(student_id)
  );

CREATE POLICY faculty_class_sessions_staff_all ON public.faculty_class_sessions
  FOR ALL USING (public.faculty_can_access_batch(batch_id))
  WITH CHECK (public.faculty_can_access_batch(batch_id));

CREATE POLICY faculty_class_sessions_student_parent_select ON public.faculty_class_sessions
  FOR SELECT USING (batch_id IN (SELECT public.own_or_child_faculty_batch_ids()));
