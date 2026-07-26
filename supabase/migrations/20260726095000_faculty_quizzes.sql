-- Faculty portal clone of public.quizzes/quiz_questions/quiz_attempts
-- (see 20260705110000_quizzes.sql) — MCQ practice quizzes scoped to the
-- faculty_staff role and faculty_batches instead of teacher/course_batches.
--
-- Same security model as the original: students get NO select on
-- faculty_quiz_questions — correct answers never leave the server. Questions
-- are served answer-stripped and attempts are written only by the server
-- action (admin client), so scores cannot be forged; students have
-- read-only access to their own attempts.

CREATE TABLE public.faculty_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.faculty_batches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  time_limit_minutes INT CHECK (time_limit_minutes IS NULL OR time_limit_minutes > 0),
  max_attempts INT NOT NULL DEFAULT 0 CHECK (max_attempts >= 0), -- 0 = unlimited
  published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX faculty_quizzes_course_idx ON public.faculty_quizzes(course_id, published);
CREATE INDEX faculty_quizzes_batch_idx ON public.faculty_quizzes(batch_id);

CREATE TABLE public.faculty_quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.faculty_quizzes(id) ON DELETE CASCADE,
  position INT NOT NULL DEFAULT 0,
  prompt TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INT NOT NULL CHECK (correct_index >= 0),
  points INT NOT NULL DEFAULT 1 CHECK (points > 0)
);

CREATE INDEX faculty_quiz_questions_quiz_idx ON public.faculty_quiz_questions(quiz_id, position);

CREATE TABLE public.faculty_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.faculty_quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  score INT NOT NULL DEFAULT 0,
  max_score INT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX faculty_quiz_attempts_quiz_idx ON public.faculty_quiz_attempts(quiz_id);
CREATE INDEX faculty_quiz_attempts_student_idx ON public.faculty_quiz_attempts(student_id, quiz_id);

CREATE OR REPLACE FUNCTION public.faculty_staff_can_access_quiz(p_quiz_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.faculty_quizzes q
    WHERE q.id = p_quiz_id AND public.faculty_can_access_course(q.course_id)
  );
$$;

ALTER TABLE public.faculty_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty_quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY faculty_quizzes_staff_all ON public.faculty_quizzes
  FOR ALL TO authenticated
  USING (public.faculty_can_access_course(course_id))
  WITH CHECK (public.faculty_can_access_course(course_id));

CREATE POLICY faculty_quizzes_student_select ON public.faculty_quizzes
  FOR SELECT TO authenticated
  USING (
    published
    AND (
      (batch_id IS NULL AND course_id IN (SELECT public.student_enrolled_course_ids()))
      OR batch_id IN (SELECT public.own_or_child_faculty_batch_ids())
    )
  );

-- CRITICAL: no student SELECT policy on faculty_quiz_questions — questions
-- and correct answers are only ever read server-side via the admin client
-- in the quiz-taking action, never exposed via RLS to students. Mirrors the
-- original quiz_questions table exactly.
CREATE POLICY faculty_quiz_questions_staff_all ON public.faculty_quiz_questions
  FOR ALL TO authenticated
  USING (public.faculty_staff_can_access_quiz(quiz_id))
  WITH CHECK (public.faculty_staff_can_access_quiz(quiz_id));

CREATE POLICY faculty_quiz_attempts_staff_select ON public.faculty_quiz_attempts
  FOR SELECT TO authenticated
  USING (public.faculty_staff_can_access_quiz(quiz_id));

-- No student INSERT policy — attempts are written via the admin/service-role
-- client in submitFacultyQuizAttempt, bypassing RLS entirely, exactly like
-- the original quiz_attempts table.
CREATE POLICY faculty_quiz_attempts_own_select ON public.faculty_quiz_attempts
  FOR SELECT TO authenticated
  USING (student_id = public.own_student_id() OR public.is_parent_of(student_id));
