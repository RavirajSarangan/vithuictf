-- Allow students and parents to read their batch enrollments, sessions, and batches

CREATE POLICY batch_enrollments_student_parent_select ON public.batch_enrollments
  FOR SELECT USING (
    student_id = public.own_student_id()
    OR public.is_parent_of(student_id)
  );

CREATE POLICY course_batches_student_parent_select ON public.course_batches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.batch_enrollments e
      WHERE e.batch_id = id
        AND e.active = true
        AND (
          e.student_id = public.own_student_id()
          OR public.is_parent_of(e.student_id)
        )
    )
  );

CREATE POLICY class_sessions_student_parent_select ON public.class_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.batch_enrollments e
      WHERE e.batch_id = batch_id
        AND e.active = true
        AND (
          e.student_id = public.own_student_id()
          OR public.is_parent_of(e.student_id)
        )
    )
  );

DROP POLICY IF EXISTS attendance_records_select ON public.attendance_records;

CREATE POLICY attendance_records_select ON public.attendance_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.class_sessions s
      JOIN public.course_batches b ON b.id = s.batch_id
      WHERE s.id = session_id AND public.teacher_can_access_course(b.course_id)
    )
    OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    OR public.is_parent_of(student_id)
  );
