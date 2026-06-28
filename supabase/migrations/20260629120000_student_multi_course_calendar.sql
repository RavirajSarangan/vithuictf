-- Allow students to read calendar sessions for any actively enrolled course (via batch enrollments),
-- not only their primary students.course_id.

CREATE OR REPLACE FUNCTION public.student_enrolled_course_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT cb.course_id
  FROM public.batch_enrollments be
  JOIN public.course_batches cb ON cb.id = be.batch_id
  JOIN public.students s ON s.id = be.student_id
  WHERE s.user_id = auth.uid()
    AND be.active = true
    AND cb.course_id IS NOT NULL
  UNION
  SELECT s.course_id
  FROM public.students s
  WHERE s.user_id = auth.uid()
    AND s.course_id IS NOT NULL;
$$;

DROP POLICY IF EXISTS calendar_sessions_select ON public.calendar_sessions;

CREATE POLICY calendar_sessions_select ON public.calendar_sessions
FOR SELECT
USING (
  public.is_staff()
  OR course_id IS NULL
  OR course_id IN (SELECT public.student_enrolled_course_ids())
  OR EXISTS (
    SELECT 1
    FROM public.parent_student_links psl
    JOIN public.parents p ON p.id = psl.parent_id
    JOIN public.students s ON s.id = psl.student_id
    WHERE p.user_id = auth.uid()
      AND (
        calendar_sessions.course_id IS NULL
        OR calendar_sessions.course_id = s.course_id
        OR calendar_sessions.course_id IN (
          SELECT cb.course_id
          FROM public.batch_enrollments be
          JOIN public.course_batches cb ON cb.id = be.batch_id
          WHERE be.student_id = s.id
            AND be.active = true
            AND cb.course_id IS NOT NULL
        )
      )
  )
);
