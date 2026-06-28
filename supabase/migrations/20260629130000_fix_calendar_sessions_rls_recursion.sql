-- Fix infinite recursion in calendar_sessions_select (batch_enrollments ↔ course_batches RLS loop).
-- Parent course visibility uses SECURITY DEFINER helpers instead of inline subqueries.

CREATE OR REPLACE FUNCTION public.parent_linked_student_course_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT s.course_id
  FROM public.parent_student_links psl
  JOIN public.parents p ON p.id = psl.parent_id
  JOIN public.students s ON s.id = psl.student_id
  WHERE p.user_id = auth.uid()
    AND s.course_id IS NOT NULL
  UNION
  SELECT DISTINCT cb.course_id
  FROM public.parent_student_links psl
  JOIN public.parents p ON p.id = psl.parent_id
  JOIN public.batch_enrollments be ON be.student_id = psl.student_id
  JOIN public.course_batches cb ON cb.id = be.batch_id
  WHERE p.user_id = auth.uid()
    AND be.active = true
    AND cb.course_id IS NOT NULL;
$$;

DROP POLICY IF EXISTS calendar_sessions_select ON public.calendar_sessions;

CREATE POLICY calendar_sessions_select ON public.calendar_sessions
FOR SELECT
USING (
  public.is_staff()
  OR course_id IS NULL
  OR course_id IN (SELECT public.student_enrolled_course_ids())
  OR course_id IN (SELECT public.parent_linked_student_course_ids())
);
