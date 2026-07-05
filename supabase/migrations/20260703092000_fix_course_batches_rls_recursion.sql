-- Fix infinite recursion (42P17) between course_batches and batch_enrollments RLS.
--
-- 20260628160000 added course_batches_student_parent_select, which queries
-- batch_enrollments inline; the staff policies on batch_enrollments /
-- class_sessions / attendance_records query course_batches inline. Evaluating
-- either table's policy re-enters the other's, so every authenticated query on
-- course_batches fails — this is what broke opening a course from the admin
-- portal (getOrCreateCourseBatch always failed and bounced back).
--
-- Same fix pattern as 20260629130000 (calendar_sessions): move the cross-table
-- lookups into SECURITY DEFINER helpers so policy evaluation never triggers the
-- other table's RLS.

CREATE OR REPLACE FUNCTION public.staff_can_access_batch(p_batch_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.course_batches b
    WHERE b.id = p_batch_id AND public.teacher_can_access_course(b.course_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.staff_can_access_session(p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_sessions s
    JOIN public.course_batches b ON b.id = s.batch_id
    WHERE s.id = p_session_id AND public.teacher_can_access_course(b.course_id)
  );
$$;

-- Batch ids visible to the current student or parent, resolved with definer
-- rights so it never evaluates batch_enrollments RLS.
CREATE OR REPLACE FUNCTION public.own_or_child_batch_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT be.batch_id
  FROM public.batch_enrollments be
  WHERE be.active = true
    AND (
      be.student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
      OR public.is_parent_of(be.student_id)
    );
$$;

-- course_batches: replace the recursive student/parent policy.
DROP POLICY IF EXISTS course_batches_student_parent_select ON public.course_batches;
CREATE POLICY course_batches_student_parent_select ON public.course_batches
  FOR SELECT USING (id IN (SELECT public.own_or_child_batch_ids()));

-- batch_enrollments: staff policies no longer query course_batches inline.
DROP POLICY IF EXISTS batch_enrollments_select ON public.batch_enrollments;
CREATE POLICY batch_enrollments_select ON public.batch_enrollments
  FOR SELECT USING (public.staff_can_access_batch(batch_id));

DROP POLICY IF EXISTS batch_enrollments_write ON public.batch_enrollments;
CREATE POLICY batch_enrollments_write ON public.batch_enrollments
  FOR ALL USING (public.staff_can_access_batch(batch_id))
  WITH CHECK (public.staff_can_access_batch(batch_id));

-- class_sessions: same treatment for staff and student/parent policies.
DROP POLICY IF EXISTS class_sessions_select ON public.class_sessions;
CREATE POLICY class_sessions_select ON public.class_sessions
  FOR SELECT USING (public.staff_can_access_batch(batch_id));

DROP POLICY IF EXISTS class_sessions_write ON public.class_sessions;
CREATE POLICY class_sessions_write ON public.class_sessions
  FOR ALL USING (public.staff_can_access_batch(batch_id))
  WITH CHECK (public.staff_can_access_batch(batch_id));

DROP POLICY IF EXISTS class_sessions_student_parent_select ON public.class_sessions;
CREATE POLICY class_sessions_student_parent_select ON public.class_sessions
  FOR SELECT USING (batch_id IN (SELECT public.own_or_child_batch_ids()));

-- attendance_records: replace inline class_sessions/course_batches joins.
DROP POLICY IF EXISTS attendance_records_select ON public.attendance_records;
CREATE POLICY attendance_records_select ON public.attendance_records
  FOR SELECT USING (
    public.staff_can_access_session(session_id)
    OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    OR public.is_parent_of(student_id)
  );

DROP POLICY IF EXISTS attendance_records_write ON public.attendance_records;
CREATE POLICY attendance_records_write ON public.attendance_records
  FOR ALL USING (public.staff_can_access_session(session_id))
  WITH CHECK (public.staff_can_access_session(session_id));
