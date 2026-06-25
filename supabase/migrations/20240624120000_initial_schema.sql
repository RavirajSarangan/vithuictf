-- ICTF SLMP — Supabase schema with RLS (security-first)

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE public.user_role AS ENUM ('student', 'parent', 'teacher', 'admin');
CREATE TYPE public.course_level AS ENUM ('OL', 'AL', 'University', 'Professional');
CREATE TYPE public.resource_category AS ENUM ('notes', 'past_papers', 'videos', 'assignments', 'study_guides');
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late');
CREATE TYPE public.notification_type AS ENUM ('result', 'attendance', 'announcement', 'achievement');
CREATE TYPE public.payment_status AS ENUM ('paid', 'pending', 'overdue');
CREATE TYPE public.resource_type AS ENUM ('pdf', 'video');

-- Profiles (extends auth.users — role stored here, NOT user_metadata)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'student',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX profiles_role_idx ON public.profiles(role);
CREATE INDEX profiles_email_idx ON public.profiles(email);

-- Security helpers (security definer, fixed search_path)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'teacher')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Courses (before dependent tables)
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  level public.course_level NOT NULL,
  teacher_id UUID,
  teacher_name TEXT NOT NULL DEFAULT '',
  student_count INT NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Teachers
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  subjects TEXT[] NOT NULL DEFAULT '{}',
  certified BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id)
);

-- Students
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  course_name TEXT NOT NULL DEFAULT '',
  grade TEXT NOT NULL DEFAULT 'B',
  rank INT NOT NULL DEFAULT 0,
  attendance_pct INT NOT NULL DEFAULT 0,
  streak INT NOT NULL DEFAULT 0,
  points INT NOT NULL DEFAULT 0,
  performance INT NOT NULL DEFAULT 0,
  photo_url TEXT,
  UNIQUE(user_id)
);

CREATE INDEX students_course_id_idx ON public.students(course_id);
CREATE INDEX students_user_id_idx ON public.students(user_id);

-- Parents
CREATE TABLE public.parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  UNIQUE(user_id)
);

CREATE TABLE public.parent_student_links (
  parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  PRIMARY KEY (parent_id, student_id)
);

CREATE INDEX parent_student_links_student_idx ON public.parent_student_links(student_id);

-- Exams & Results
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  exam_date DATE NOT NULL,
  subjects TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE public.results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES public.exams(id) ON DELETE SET NULL,
  exam_title TEXT NOT NULL,
  subject TEXT NOT NULL,
  grade TEXT NOT NULL,
  marks INT NOT NULL,
  max_marks INT NOT NULL DEFAULT 100,
  rank INT NOT NULL DEFAULT 0,
  term TEXT NOT NULL,
  result_date DATE NOT NULL
);

CREATE INDEX results_student_id_idx ON public.results(student_id);

-- Attendance
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status public.attendance_status NOT NULL,
  UNIQUE(student_id, attendance_date)
);

CREATE INDEX attendance_student_id_idx ON public.attendance(student_id);

-- Resources
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category public.resource_category NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  storage_path TEXT NOT NULL,
  view_only BOOLEAN NOT NULL DEFAULT true,
  popular BOOLEAN NOT NULL DEFAULT false,
  type public.resource_type NOT NULL DEFAULT 'pdf',
  views INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX resources_course_id_idx ON public.resources(course_id);
CREATE INDEX resources_category_idx ON public.resources(category);

-- Bookmarks
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  UNIQUE(user_id, resource_id)
);

-- Achievements
CREATE TABLE public.badge_definitions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  points INT NOT NULL DEFAULT 0
);

CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES public.badge_definitions(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Leaderboard (denormalized)
CREATE TABLE public.leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  points INT NOT NULL DEFAULT 0,
  rank INT NOT NULL DEFAULT 0,
  performance INT NOT NULL DEFAULT 0,
  UNIQUE(student_id, course_id)
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  type public.notification_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_id_idx ON public.notifications(user_id);

-- Payments & Certificates
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'pending',
  method TEXT NOT NULL DEFAULT '',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Public content
CREATE TABLE public.success_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  course TEXT NOT NULL,
  achievement TEXT NOT NULL,
  review TEXT NOT NULL,
  photo TEXT NOT NULL DEFAULT ''
);

CREATE TABLE public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE public.site_stats (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  students INT NOT NULL DEFAULT 0,
  courses INT NOT NULL DEFAULT 0,
  satisfaction INT NOT NULL DEFAULT 0,
  resources INT NOT NULL DEFAULT 0,
  years_experience INT NOT NULL DEFAULT 0,
  certified_teachers INT NOT NULL DEFAULT 0,
  success_rate INT NOT NULL DEFAULT 0
);

CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  activity_type TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dependent security helpers (after all tables exist)
CREATE OR REPLACE FUNCTION public.is_parent_of(p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.parent_student_links psl
    JOIN public.parents p ON p.id = psl.parent_id
    WHERE p.user_id = auth.uid() AND psl.student_id = p_student_id
  );
$$;

CREATE OR REPLACE FUNCTION public.own_student_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.students WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Auto-create profile on signup (role from app_metadata only — set server-side)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role public.user_role := 'student';
BEGIN
  IF NEW.raw_app_meta_data ? 'role' THEN
    assigned_role := (NEW.raw_app_meta_data->>'role')::public.user_role;
  END IF;

  INSERT INTO public.profiles (id, email, display_name, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    assigned_role,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on ALL tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT USING (id = auth.uid() OR public.is_staff());
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY profiles_admin_all ON public.profiles FOR ALL USING (public.is_admin());

-- Courses — authenticated read, staff write
CREATE POLICY courses_select_auth ON public.courses FOR SELECT TO authenticated USING (true);
CREATE POLICY courses_select_anon ON public.courses FOR SELECT TO anon USING (true);
CREATE POLICY courses_staff_write ON public.courses FOR ALL USING (public.is_staff());

-- Students
CREATE POLICY students_select ON public.students FOR SELECT USING (
  user_id = auth.uid() OR public.is_staff() OR public.is_parent_of(id)
);
CREATE POLICY students_staff_write ON public.students FOR ALL USING (public.is_staff());

-- Parents
CREATE POLICY parents_select ON public.parents FOR SELECT USING (
  user_id = auth.uid() OR public.is_staff()
);
CREATE POLICY parents_staff_write ON public.parents FOR ALL USING (public.is_staff());

CREATE POLICY parent_links_select ON public.parent_student_links FOR SELECT USING (
  public.is_staff() OR EXISTS (
    SELECT 1 FROM public.parents p WHERE p.id = parent_id AND p.user_id = auth.uid()
  )
);
CREATE POLICY parent_links_staff_write ON public.parent_student_links FOR ALL USING (public.is_staff());

-- Teachers
CREATE POLICY teachers_select ON public.teachers FOR SELECT TO authenticated USING (true);
CREATE POLICY teachers_staff_write ON public.teachers FOR ALL USING (public.is_staff());

-- Exams
CREATE POLICY exams_select ON public.exams FOR SELECT TO authenticated USING (true);
CREATE POLICY exams_staff_write ON public.exams FOR ALL USING (public.is_staff());

-- Results
CREATE POLICY results_select ON public.results FOR SELECT USING (
  student_id = public.own_student_id() OR public.is_staff() OR public.is_parent_of(student_id)
);
CREATE POLICY results_staff_write ON public.results FOR ALL USING (public.is_staff());

-- Attendance
CREATE POLICY attendance_select ON public.attendance FOR SELECT USING (
  student_id = public.own_student_id() OR public.is_staff() OR public.is_parent_of(student_id)
);
CREATE POLICY attendance_staff_write ON public.attendance FOR ALL USING (public.is_staff());

-- Resources — metadata only; files via signed URLs
CREATE POLICY resources_select ON public.resources FOR SELECT TO authenticated USING (true);
CREATE POLICY resources_staff_write ON public.resources FOR ALL USING (public.is_staff());

-- Bookmarks
CREATE POLICY bookmarks_own ON public.bookmarks FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Badge definitions — public read
CREATE POLICY badges_select ON public.badge_definitions FOR SELECT USING (true);
CREATE POLICY badges_staff_write ON public.badge_definitions FOR ALL USING (public.is_staff());

-- Achievements
CREATE POLICY achievements_select ON public.achievements FOR SELECT USING (
  student_id = public.own_student_id() OR public.is_staff() OR public.is_parent_of(student_id)
);
CREATE POLICY achievements_staff_write ON public.achievements FOR ALL USING (public.is_staff());

-- Leaderboard — authenticated read
CREATE POLICY leaderboard_select ON public.leaderboard FOR SELECT TO authenticated USING (true);
CREATE POLICY leaderboard_staff_write ON public.leaderboard FOR ALL USING (public.is_staff());

-- Notifications
CREATE POLICY notifications_own ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY notifications_update_own ON public.notifications FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY notifications_admin_insert ON public.notifications FOR INSERT WITH CHECK (public.is_admin());

-- Payments & Certificates — staff only
CREATE POLICY payments_staff ON public.payments FOR ALL USING (public.is_staff());
CREATE POLICY certificates_select ON public.certificates FOR SELECT USING (
  student_id = public.own_student_id() OR public.is_staff() OR public.is_parent_of(student_id)
);
CREATE POLICY certificates_staff_write ON public.certificates FOR ALL USING (public.is_staff());

-- Public marketing content
CREATE POLICY success_stories_public ON public.success_stories FOR SELECT USING (true);
CREATE POLICY faqs_public ON public.faqs FOR SELECT USING (true);
CREATE POLICY site_stats_public ON public.site_stats FOR SELECT USING (true);
CREATE POLICY site_stats_admin ON public.site_stats FOR ALL USING (public.is_admin());

-- Activities
CREATE POLICY activities_select ON public.activities FOR SELECT USING (
  student_id = public.own_student_id() OR public.is_staff() OR public.is_parent_of(student_id)
);
CREATE POLICY activities_staff_write ON public.activities FOR ALL USING (public.is_staff());

-- Storage bucket policies (run after bucket creation)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', false);
