-- Calendar: subject categories + sessions with auto duration

CREATE TYPE public.session_type AS ENUM ('recurring', 'one_off');
CREATE TYPE public.session_mode AS ENUM ('physical', 'online');

CREATE TABLE public.subject_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#273461',
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.calendar_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.subject_categories(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  session_type public.session_type NOT NULL DEFAULT 'recurring',
  day_of_week INT CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6)),
  session_date DATE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 0,
  teacher_name TEXT NOT NULL DEFAULT '',
  room TEXT NOT NULL DEFAULT '',
  mode public.session_mode NOT NULL DEFAULT 'physical',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT calendar_sessions_type_check CHECK (
    (session_type = 'recurring' AND day_of_week IS NOT NULL AND session_date IS NULL)
    OR (session_type = 'one_off' AND session_date IS NOT NULL)
  ),
  CONSTRAINT calendar_sessions_time_check CHECK (end_time > start_time)
);

CREATE INDEX calendar_sessions_course_idx ON public.calendar_sessions(course_id);
CREATE INDEX calendar_sessions_category_idx ON public.calendar_sessions(category_id);

CREATE OR REPLACE FUNCTION public.set_calendar_session_duration()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.duration_minutes := GREATEST(0, EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time))::INT / 60);
  RETURN NEW;
END;
$$;

CREATE TRIGGER calendar_sessions_duration
  BEFORE INSERT OR UPDATE OF start_time, end_time ON public.calendar_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_calendar_session_duration();

CREATE OR REPLACE FUNCTION public.student_enrolled_course_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT course_id FROM public.students WHERE user_id = auth.uid() LIMIT 1;
$$;

ALTER TABLE public.subject_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY subject_categories_select ON public.subject_categories FOR SELECT USING (active = true OR public.is_staff());
CREATE POLICY subject_categories_staff ON public.subject_categories FOR ALL USING (public.is_staff());

CREATE POLICY calendar_sessions_select ON public.calendar_sessions FOR SELECT USING (
  public.is_staff() OR course_id IS NULL OR course_id = public.student_enrolled_course_id()
  OR EXISTS (
    SELECT 1 FROM public.parent_student_links psl
    JOIN public.parents p ON p.id = psl.parent_id
    JOIN public.students s ON s.id = psl.student_id
    WHERE p.user_id = auth.uid() AND (calendar_sessions.course_id IS NULL OR s.course_id = calendar_sessions.course_id)
  )
);
CREATE POLICY calendar_sessions_staff ON public.calendar_sessions FOR ALL USING (public.is_staff());

INSERT INTO public.subject_categories (name, slug, color, sort_order) VALUES
  ('ICT', 'ict', '#2563EB', 1),
  ('Biology', 'biology', '#16A34A', 2),
  ('Chemistry', 'chemistry', '#9333EA', 3),
  ('Physics', 'physics', '#EA580C', 4),
  ('Combined Mathematics', 'combined-maths', '#273461', 5),
  ('English', 'english', '#DC2626', 6)
ON CONFLICT (slug) DO NOTHING;
