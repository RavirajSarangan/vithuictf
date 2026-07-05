-- MCQ practice quizzes: staff author per course (optionally per batch),
-- students take them with server-side auto-marking.
--
-- Students get NO select on quiz_questions — correct answers never leave the
-- server. Questions are served answer-stripped and attempts are written only
-- by the server action (admin client), so scores cannot be forged; students
-- have read-only access to their own attempts.

CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.course_batches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  time_limit_minutes INT CHECK (time_limit_minutes IS NULL OR time_limit_minutes > 0),
  max_attempts INT NOT NULL DEFAULT 0 CHECK (max_attempts >= 0), -- 0 = unlimited
  published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX quizzes_course_idx ON public.quizzes(course_id, published);
CREATE INDEX quizzes_batch_idx ON public.quizzes(batch_id);

CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  position INT NOT NULL DEFAULT 0,
  prompt TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INT NOT NULL CHECK (correct_index >= 0),
  points INT NOT NULL DEFAULT 1 CHECK (points > 0)
);

CREATE INDEX quiz_questions_quiz_idx ON public.quiz_questions(quiz_id, position);

CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  score INT NOT NULL DEFAULT 0,
  max_score INT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX quiz_attempts_quiz_idx ON public.quiz_attempts(quiz_id);
CREATE INDEX quiz_attempts_student_idx ON public.quiz_attempts(student_id, quiz_id);

CREATE OR REPLACE FUNCTION public.staff_can_access_quiz(p_quiz_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.quizzes q
    WHERE q.id = p_quiz_id AND public.teacher_can_access_course(q.course_id)
  );
$$;

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY quizzes_staff_all ON public.quizzes
  FOR ALL TO authenticated
  USING (public.teacher_can_access_course(course_id))
  WITH CHECK (public.teacher_can_access_course(course_id));

CREATE POLICY quizzes_student_select ON public.quizzes
  FOR SELECT TO authenticated
  USING (
    published
    AND (
      (batch_id IS NULL AND course_id IN (SELECT public.student_enrolled_course_ids()))
      OR batch_id IN (SELECT public.own_or_child_batch_ids())
    )
  );

CREATE POLICY quiz_questions_staff_all ON public.quiz_questions
  FOR ALL TO authenticated
  USING (public.staff_can_access_quiz(quiz_id))
  WITH CHECK (public.staff_can_access_quiz(quiz_id));

CREATE POLICY quiz_attempts_staff_select ON public.quiz_attempts
  FOR SELECT TO authenticated
  USING (public.staff_can_access_quiz(quiz_id));

CREATE POLICY quiz_attempts_own_select ON public.quiz_attempts
  FOR SELECT TO authenticated
  USING (student_id = public.own_student_id() OR public.is_parent_of(student_id));
