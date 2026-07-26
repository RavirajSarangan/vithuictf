-- Faculty attendance: public.faculty_attendance_records, cloned from the
-- teacher-side public.attendance_records. See
-- 20260628120200_academics_batches_attendance.sql for the original table/RLS
-- and 20260703092000_fix_course_batches_rls_recursion.sql for the final RLS
-- shape (SECURITY DEFINER helper instead of an inline cross-table join) —
-- that final shape is what's mirrored here, just targeting the faculty_*
-- tables and faculty_can_access_session() instead of staff_can_access_session().
--
-- Reuses the existing public.attendance_status enum (present/absent/late)
-- rather than recreating it — it's a shared, role-agnostic type.

CREATE TABLE public.faculty_attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.faculty_class_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status public.attendance_status NOT NULL,
  marked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  marked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, student_id)
);

CREATE INDEX faculty_attendance_records_session_idx ON public.faculty_attendance_records(session_id);
CREATE INDEX faculty_attendance_records_student_idx ON public.faculty_attendance_records(student_id);

ALTER TABLE public.faculty_attendance_records ENABLE ROW LEVEL SECURITY;

-- Staff (faculty_staff scoped to the course via faculty_can_access_session,
-- or admin/super_admin) can read every record for sessions they can access.
-- The student themself, or a parent of that student, can also read their own
-- attendance rows — mirrors attendance_records_select's final state exactly.
CREATE POLICY faculty_attendance_records_select ON public.faculty_attendance_records
  FOR SELECT USING (
    public.faculty_can_access_session(session_id)
    OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    OR public.is_parent_of(student_id)
  );

CREATE POLICY faculty_attendance_records_write ON public.faculty_attendance_records
  FOR ALL USING (public.faculty_can_access_session(session_id))
  WITH CHECK (public.faculty_can_access_session(session_id));
