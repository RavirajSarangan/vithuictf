-- Academics: batches, enrollments, class sessions, attendance
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late');
CREATE TYPE public.class_session_status AS ENUM ('scheduled', 'completed', 'cancelled');

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ;

CREATE TABLE public.course_batches (
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

CREATE INDEX course_batches_course_id_idx ON public.course_batches(course_id);
CREATE INDEX course_batches_active_idx ON public.course_batches(active);

CREATE TABLE public.batch_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.course_batches(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  enrollment_code TEXT NOT NULL UNIQUE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (batch_id, student_id)
);

CREATE INDEX batch_enrollments_batch_idx ON public.batch_enrollments(batch_id);
CREATE INDEX batch_enrollments_student_idx ON public.batch_enrollments(student_id);

CREATE TABLE public.class_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.course_batches(id) ON DELETE CASCADE,
  session_number INT NOT NULL CHECK (session_number > 0),
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status public.class_session_status NOT NULL DEFAULT 'scheduled',
  UNIQUE (batch_id, session_number)
);

CREATE INDEX class_sessions_batch_idx ON public.class_sessions(batch_id);

CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status public.attendance_status NOT NULL,
  marked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  marked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, student_id)
);

CREATE INDEX attendance_records_session_idx ON public.attendance_records(session_id);
CREATE INDEX attendance_records_student_idx ON public.attendance_records(student_id);

-- Teacher-scoped batch access helper
CREATE OR REPLACE FUNCTION public.teacher_can_access_course(p_course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.user_id = auth.uid()
        AND p_course_id = ANY(COALESCE(t.course_ids, '{}'))
    );
$$;

ALTER TABLE public.course_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY course_batches_select ON public.course_batches
  FOR SELECT USING (public.teacher_can_access_course(course_id));

CREATE POLICY course_batches_write ON public.course_batches
  FOR ALL USING (public.teacher_can_access_course(course_id))
  WITH CHECK (public.teacher_can_access_course(course_id));

CREATE POLICY batch_enrollments_select ON public.batch_enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.course_batches b
      WHERE b.id = batch_id AND public.teacher_can_access_course(b.course_id)
    )
  );

CREATE POLICY batch_enrollments_write ON public.batch_enrollments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.course_batches b
      WHERE b.id = batch_id AND public.teacher_can_access_course(b.course_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.course_batches b
      WHERE b.id = batch_id AND public.teacher_can_access_course(b.course_id)
    )
  );

CREATE POLICY class_sessions_select ON public.class_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.course_batches b
      WHERE b.id = batch_id AND public.teacher_can_access_course(b.course_id)
    )
  );

CREATE POLICY class_sessions_write ON public.class_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.course_batches b
      WHERE b.id = batch_id AND public.teacher_can_access_course(b.course_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.course_batches b
      WHERE b.id = batch_id AND public.teacher_can_access_course(b.course_id)
    )
  );

CREATE POLICY attendance_records_select ON public.attendance_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.class_sessions s
      JOIN public.course_batches b ON b.id = s.batch_id
      WHERE s.id = session_id AND public.teacher_can_access_course(b.course_id)
    )
    OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

CREATE POLICY attendance_records_write ON public.attendance_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.class_sessions s
      JOIN public.course_batches b ON b.id = s.batch_id
      WHERE s.id = session_id AND public.teacher_can_access_course(b.course_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.class_sessions s
      JOIN public.course_batches b ON b.id = s.batch_id
      WHERE s.id = session_id AND public.teacher_can_access_course(b.course_id)
    )
  );
