-- Online exam draft/publish lifecycle: staff can build an exam (course,
-- questions, written paper, deadline) invisibly, then publish it in one
-- step. Only affects is_online_exam rows — ordinary batch exams are
-- unaffected (published defaults false but their visibility branch below
-- never checks it).

ALTER TABLE public.exams
  ADD COLUMN published BOOLEAN NOT NULL DEFAULT false;

DROP POLICY exams_student_parent_select ON public.exams;

CREATE POLICY exams_student_parent_select ON public.exams
  FOR SELECT TO authenticated
  USING (
    (
      batch_id IN (SELECT public.own_or_child_batch_ids())
      OR (batch_id IS NULL AND course_id IN (SELECT public.student_enrolled_course_ids()))
    )
    AND (NOT is_online_exam OR published)
  );
