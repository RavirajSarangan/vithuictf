-- ICTF SLMP combined migrations (generated 2026-06-27T03:37:24Z)
-- Run in Supabase Dashboard → SQL Editor if CLI is unavailable

-- >>> BEGIN 20240624120000_initial_schema.sql
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

-- >>> END 20240624120000_initial_schema.sql

-- >>> BEGIN 20240624120001_storage_policies.sql
-- Storage bucket + RLS for protected resources
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resources',
  'resources',
  false,
  52428800,
  ARRAY['application/pdf', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can read resources (signed URLs still recommended)
CREATE POLICY resources_storage_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'resources');

-- Staff can upload/update
CREATE POLICY resources_storage_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resources' AND public.is_staff());

CREATE POLICY resources_storage_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'resources' AND public.is_staff())
  WITH CHECK (bucket_id = 'resources' AND public.is_staff());

CREATE POLICY resources_storage_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'resources' AND public.is_admin());

-- >>> END 20240624120001_storage_policies.sql

-- >>> BEGIN 20240624120002_seed_reference_data.sql
-- Reference data for ICTF SLMP (no auth users — create those via admin or Supabase Auth)

INSERT INTO public.site_stats (id, students, courses, satisfaction, resources, years_experience, certified_teachers, success_rate)
VALUES (1, 5000, 150, 98, 10000, 15, 85, 96)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.courses (id, name, level, teacher_name, student_count, description) VALUES
  ('a0000001-0000-4000-8000-000000000001', 'A/L Combined Mathematics', 'AL', 'Dr. Silva', 320, 'Advanced level mathematics preparation'),
  ('a0000001-0000-4000-8000-000000000002', 'O/L Science', 'OL', 'Dr. Silva', 450, 'Ordinary level science stream'),
  ('a0000001-0000-4000-8000-000000000003', 'A/L Physics', 'AL', 'Dr. Silva', 280, 'Physics for A/L students'),
  ('a0000001-0000-4000-8000-000000000004', 'University IT Foundation', 'University', 'Dr. Silva', 120, 'IT fundamentals for university'),
  ('a0000001-0000-4000-8000-000000000005', 'Professional Web Development', 'Professional', 'Dr. Silva', 95, 'Full-stack web development course')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.badge_definitions (id, title, description, icon, points) VALUES
  ('streak-7', 'Week Warrior', '7 day study streak', 'flame', 100),
  ('streak-30', 'Monthly Master', '30 day study streak', 'zap', 500),
  ('top-20', 'Top 20', 'Ranked in top 20', 'trophy', 300),
  ('top-10', 'Elite Ten', 'Ranked in top 10', 'crown', 500),
  ('perfect-attendance', 'Perfect Month', '100% attendance in a month', 'calendar', 200),
  ('resource-explorer', 'Resource Explorer', 'Viewed 50 resources', 'book', 150)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.success_stories (id, name, course, achievement, review, photo) VALUES
  (gen_random_uuid(), 'Amaya Fernando', 'A/L Combined Mathematics', 'District Rank 2 - 2025 A/L', 'ICTF transformed my approach to mathematics. The resources and tracking kept me motivated every single day.', ''),
  (gen_random_uuid(), 'Kavindu Perera', 'O/L Science', '9 A''s at O/L Examination', 'The attendance tracking and past papers made all the difference. I could see my progress clearly.', ''),
  (gen_random_uuid(), 'Dilshan Wick', 'A/L Physics', 'University Entrance - Engineering', 'Best decision for my A/L journey. The platform is modern and the teachers are exceptional.', '')
ON CONFLICT DO NOTHING;

INSERT INTO public.faqs (id, question, answer, sort_order) VALUES
  (gen_random_uuid(), 'How do I access my results?', 'Log in to your student portal and navigate to the Results section. All published exam results will appear with detailed analytics.', 1),
  (gen_random_uuid(), 'Can parents monitor student progress?', 'Yes! Parents have a dedicated portal to track attendance, view performance reports, and receive real-time notifications.', 2),
  (gen_random_uuid(), 'Are learning resources downloadable?', 'Resources are view-only within the platform to protect intellectual property. PDFs are watermarked with your student ID.', 3),
  (gen_random_uuid(), 'How does the leaderboard work?', 'Points are earned through attendance, resource engagement, exam performance, and achievements. Top performers are ranked per course.', 4),
  (gen_random_uuid(), 'Is there a mobile app?', 'The platform is fully responsive and works on all devices. A dedicated mobile app is coming soon.', 5),
  (gen_random_uuid(), 'How do I contact support?', 'Reach us via WhatsApp, email, or phone. Our support team is available Monday to Saturday, 8 AM to 6 PM.', 6)
ON CONFLICT DO NOTHING;

INSERT INTO public.resources (title, category, course_id, course_name, description, storage_path, view_only, popular, type, views) VALUES
  ('Differentiation Notes', 'notes', 'a0000001-0000-4000-8000-000000000001', 'A/L Combined Mathematics', 'Complete differentiation chapter notes', 'resources/demo/diff-notes.pdf', true, true, 'pdf', 1250),
  ('2025 Past Paper', 'past_papers', 'a0000001-0000-4000-8000-000000000001', 'A/L Combined Mathematics', 'Official 2025 A/L Maths paper', 'resources/demo/past-paper-2025.pdf', true, true, 'pdf', 2100),
  ('Integration Masterclass', 'videos', 'a0000001-0000-4000-8000-000000000001', 'A/L Combined Mathematics', 'Video lecture on integration techniques', 'resources/demo/integration-video.mp4', true, false, 'video', 890),
  ('O/L Science Notes', 'notes', 'a0000001-0000-4000-8000-000000000002', 'O/L Science', 'Complete O/L science notes', 'resources/demo/ol-science.pdf', true, true, 'pdf', 980);

-- >>> END 20240624120002_seed_reference_data.sql

-- >>> BEGIN 20240625120000_remove_attendance.sql
-- Remove attendance feature entirely

DROP POLICY IF EXISTS attendance_select ON public.attendance;
DROP POLICY IF EXISTS attendance_staff_write ON public.attendance;
DROP TABLE IF EXISTS public.attendance;

ALTER TABLE public.students DROP COLUMN IF EXISTS attendance_pct;

DELETE FROM public.achievements WHERE badge_id = 'perfect-attendance';
DELETE FROM public.badge_definitions WHERE id = 'perfect-attendance';

UPDATE public.notifications SET type = 'announcement' WHERE type = 'attendance';

ALTER TYPE public.notification_type RENAME TO notification_type_old;
CREATE TYPE public.notification_type AS ENUM ('result', 'announcement', 'achievement');
ALTER TABLE public.notifications
  ALTER COLUMN type TYPE public.notification_type
  USING (
    CASE type::text
      WHEN 'attendance' THEN 'announcement'::public.notification_type
      ELSE type::text::public.notification_type
    END
  );
DROP TYPE public.notification_type_old;
DROP TYPE IF EXISTS public.attendance_status;

UPDATE public.faqs SET answer = 'Yes! Parents have a dedicated portal to view performance reports and receive real-time notifications.'
WHERE question = 'Can parents monitor student progress?';

UPDATE public.faqs SET answer = 'Points are earned through resource engagement, exam performance, and achievements. Top performers are ranked per course.'
WHERE question = 'How does the leaderboard work?';

UPDATE public.success_stories SET review = 'The past papers and progress tracking made all the difference. I could see my improvement clearly.'
WHERE name = 'Kavindu Perera';

-- >>> END 20240625120000_remove_attendance.sql

-- >>> BEGIN 20240625120001_home_cms.sql
-- Home page CMS tables

CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  logo_url TEXT NOT NULL DEFAULT '',
  website_url TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.class_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  badge TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'BookOpen',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.paper_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  district TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  map_url TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.network_stats (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  paper_centers_count INT NOT NULL DEFAULT 27,
  districts_covered INT NOT NULL DEFAULT 25,
  pass_rate INT NOT NULL DEFAULT 98,
  papers_written INT NOT NULL DEFAULT 10000,
  headline TEXT NOT NULL DEFAULT 'Our Paper Center Network',
  subheadline TEXT NOT NULL DEFAULT 'Island-wide exam preparation centers',
  cta_label TEXT NOT NULL DEFAULT 'View Paper Centers',
  cta_url TEXT NOT NULL DEFAULT '#centers'
);

CREATE TABLE public.featured_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  rank_type TEXT NOT NULL CHECK (rank_type IN ('island', 'district', 'class')),
  score INT NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.home_about (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  photo_url TEXT NOT NULL DEFAULT '',
  credentials TEXT NOT NULL DEFAULT '',
  highlight_students INT NOT NULL DEFAULT 100000,
  highlight_experience_years INT NOT NULL DEFAULT 10,
  cta_label TEXT NOT NULL DEFAULT 'View Classes',
  cta_url TEXT NOT NULL DEFAULT '#programs'
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_about ENABLE ROW LEVEL SECURITY;

CREATE POLICY companies_public_read ON public.companies FOR SELECT USING (is_active = true);
CREATE POLICY companies_admin_write ON public.companies FOR ALL USING (public.is_admin());

CREATE POLICY class_programs_public_read ON public.class_programs FOR SELECT USING (is_active = true);
CREATE POLICY class_programs_admin_write ON public.class_programs FOR ALL USING (public.is_admin());

CREATE POLICY paper_centers_public_read ON public.paper_centers FOR SELECT USING (is_active = true);
CREATE POLICY paper_centers_admin_write ON public.paper_centers FOR ALL USING (public.is_admin());

CREATE POLICY network_stats_public_read ON public.network_stats FOR SELECT USING (true);
CREATE POLICY network_stats_admin_write ON public.network_stats FOR ALL USING (public.is_admin());

CREATE POLICY featured_rankings_public_read ON public.featured_rankings FOR SELECT USING (is_active = true);
CREATE POLICY featured_rankings_admin_write ON public.featured_rankings FOR ALL USING (public.is_admin());

CREATE POLICY home_about_public_read ON public.home_about FOR SELECT USING (true);
CREATE POLICY home_about_admin_write ON public.home_about FOR ALL USING (public.is_admin());

CREATE POLICY success_stories_admin_write ON public.success_stories FOR ALL USING (public.is_admin());
CREATE POLICY faqs_admin_write ON public.faqs FOR ALL USING (public.is_admin());

INSERT INTO public.network_stats (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.home_about (id, name, title, bio, credentials, highlight_students, highlight_experience_years)
VALUES (
  1,
  'ICTF Founder',
  'Island 1st Educator',
  'ICTF Academy has guided students across Sri Lanka for over a decade, delivering structured programs, real exam environments, and measurable results through our island-wide network.',
  '10+ Years at ICTF · 1 Lakh+ Students Guided',
  100000,
  10
) ON CONFLICT (id) DO NOTHING;

UPDATE public.site_stats SET students = 100000, years_experience = 10 WHERE id = 1;

INSERT INTO public.companies (name, location, description, sort_order) VALUES
  ('ICTF Colombo', 'Colombo', 'Flagship learning center with full program coverage.', 1),
  ('ICTF Kandy', 'Kandy', 'Central province hub for A/L and O/L students.', 2),
  ('ICTF Kurunegala', 'Kurunegala', 'North Western region center with paper classes.', 3),
  ('ICTF Online', 'Island-wide', 'Digital learning network accessible from anywhere.', 4);

INSERT INTO public.class_programs (title, description, badge, icon, sort_order) VALUES
  ('Theory Classes', 'Core syllabus coverage with structured concept building.', 'CORE', 'BookOpen', 1),
  ('Revision Classes', 'Exam-focused revision of high-yield topics.', '', 'RefreshCw', 2),
  ('Paper Classes', 'Weekly past paper discussions and marking schemes.', '', 'FileText', 3),
  ('Practical Sessions', 'Hands-on practical skill development.', '', 'FlaskConical', 4),
  ('Fast Track Program', 'Accelerated pathway for rapid improvement.', '', 'Zap', 5);

INSERT INTO public.featured_rankings (student_name, rank_type, score, sort_order) VALUES
  ('Nithya Karunanayake', 'island', 98, 1),
  ('Kasun Perera', 'district', 96, 2),
  ('Sandali Rathnayake', 'class', 94, 3),
  ('Dilshan Wickrama', 'class', 91, 4);

INSERT INTO public.paper_centers (name, district, address, sort_order) VALUES
  ('ICTF Colombo Center', 'Colombo', 'Colombo 07', 1),
  ('ICTF Kandy Center', 'Kandy', 'Kandy City', 2),
  ('ICTF Kurunegala Center', 'Kurunegala', 'Kurunegala Town', 3);

-- >>> END 20240625120001_home_cms.sql

-- >>> BEGIN 20240625120002_calendar.sql
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

-- >>> END 20240625120002_calendar.sql

-- >>> BEGIN 20240625120003_bilingual_home.sql
-- English + Tamil fields for home CMS sections

ALTER TABLE public.network_stats
  ADD COLUMN IF NOT EXISTS headline_ta TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS subheadline_ta TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cta_label_ta TEXT NOT NULL DEFAULT '';

ALTER TABLE public.class_programs
  ADD COLUMN IF NOT EXISTS title_ta TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description_ta TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '';

ALTER TABLE public.home_about
  ADD COLUMN IF NOT EXISTS title_ta TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bio_ta TEXT NOT NULL DEFAULT '';

UPDATE public.network_stats SET
  headline_ta = 'எங்கள் பேப்பர் மைய நெட்வொர்க்',
  subheadline_ta = 'தீவு முழுவதும் தேர்வு தயாரிப்பு மையங்கள்',
  cta_label_ta = 'பேப்பர் மையங்களைப் பார்க்க'
WHERE id = 1;

-- >>> END 20240625120003_bilingual_home.sql

-- >>> BEGIN 20240625120004_paper_center_map_coords.sql
-- Map pin coordinates for paper centers (percentage on Sri Lanka map)

ALTER TABLE public.paper_centers
  ADD COLUMN IF NOT EXISTS map_x REAL,
  ADD COLUMN IF NOT EXISTS map_y REAL;

INSERT INTO public.paper_centers (name, district, address, sort_order)
SELECT 'ICTF Jaffna Paper Center', 'Jaffna', 'Jaffna Town', 1
WHERE NOT EXISTS (
  SELECT 1 FROM public.paper_centers WHERE district ILIKE 'Jaffna'
);

UPDATE public.paper_centers SET map_x = 52, map_y = 14 WHERE district ILIKE 'Jaffna' AND map_x IS NULL;
UPDATE public.paper_centers SET map_x = 36, map_y = 72 WHERE district ILIKE 'Colombo' AND map_x IS NULL;
UPDATE public.paper_centers SET map_x = 56, map_y = 58 WHERE district ILIKE 'Kandy' AND map_x IS NULL;
UPDATE public.paper_centers SET map_x = 40, map_y = 48 WHERE district ILIKE 'Kurunegala' AND map_x IS NULL;
UPDATE public.paper_centers SET map_x = 46, map_y = 88 WHERE district ILIKE 'Galle' AND map_x IS NULL;
UPDATE public.paper_centers SET map_x = 78, map_y = 52 WHERE district ILIKE 'Batticaloa' AND map_x IS NULL;
UPDATE public.paper_centers SET map_x = 72, map_y = 38 WHERE district ILIKE 'Trincomalee' AND map_x IS NULL;

-- >>> END 20240625120004_paper_center_map_coords.sql

-- >>> BEGIN 20240625120005_admin_storage_bucket.sql
-- Admin CMS storage bucket (public read for marketing assets, admin-only write)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'admin',
  'admin',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY admin_storage_public_read ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'admin');

CREATE POLICY admin_storage_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'admin' AND public.is_admin());

CREATE POLICY admin_storage_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'admin' AND public.is_admin())
  WITH CHECK (bucket_id = 'admin' AND public.is_admin());

CREATE POLICY admin_storage_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'admin' AND public.is_admin());

-- >>> END 20240625120005_admin_storage_bucket.sql

-- >>> BEGIN 20240625120006_backend_hardening.sql
-- Backend hardening: bilingual companies, student auto-provision, seed cleanup

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS description_ta TEXT NOT NULL DEFAULT '';

DELETE FROM public.badge_definitions WHERE id = 'perfect-attendance';

-- Auto-create student row when a student account is registered
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role public.user_role := 'student';
  default_course_id UUID;
  default_course_name TEXT := 'A/L Combined Mathematics';
  display_name TEXT;
BEGIN
  IF NEW.raw_app_meta_data ? 'role' THEN
    assigned_role := (NEW.raw_app_meta_data->>'role')::public.user_role;
  END IF;

  display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1));

  INSERT INTO public.profiles (id, email, display_name, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    display_name,
    assigned_role,
    NEW.raw_user_meta_data->>'avatar_url'
  );

  IF assigned_role = 'student' THEN
    SELECT id, name INTO default_course_id, default_course_name
    FROM public.courses
    ORDER BY created_at ASC
    LIMIT 1;

    INSERT INTO public.students (
      user_id,
      student_id,
      display_name,
      email,
      course_id,
      course_name,
      grade,
      rank,
      streak,
      points,
      performance
    )
    VALUES (
      NEW.id,
      'ICTF-' || to_char(extract(epoch from now()) * 1000, 'FM999999999999'),
      display_name,
      NEW.email,
      default_course_id,
      COALESCE(default_course_name, 'General'),
      'B',
      50,
      0,
      0,
      0
    );
  END IF;

  RETURN NEW;
END;
$$;

-- >>> END 20240625120006_backend_hardening.sql

-- >>> BEGIN 20240625130000_courses_catalog.sql
-- Extend courses for admin-managed ICT catalog
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS duration_months INT,
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Replace legacy exam-prep courses with official ICT programs
DELETE FROM public.courses
WHERE id IN (
  'a0000001-0000-4000-8000-000000000001',
  'a0000001-0000-4000-8000-000000000002',
  'a0000001-0000-4000-8000-000000000003',
  'a0000001-0000-4000-8000-000000000004',
  'a0000001-0000-4000-8000-000000000005'
);

INSERT INTO public.courses (id, name, level, teacher_name, student_count, description, category, duration_months, slug) VALUES
  ('b0000001-0000-4000-8000-000000000001', 'ICT Systems Engineering', 'Professional', 'Vithoosan Sivanathan', 0, 'Build foundations in infrastructure, networks, and applied technical systems.', 'Engineering', 12, 'ict-systems'),
  ('b0000001-0000-4000-8000-000000000002', 'Technology Business Management', 'Professional', 'Vithoosan Sivanathan', 0, 'Develop leadership skills for digital teams, projects, and operations.', 'Management', 10, 'tech-business'),
  ('b0000001-0000-4000-8000-000000000003', 'Software Development Foundations', 'Professional', 'Manojan Manosanthar', 0, 'Learn programming concepts, web fundamentals, and problem-solving practice.', 'Computer Science', 9, 'software-dev'),
  ('b0000001-0000-4000-8000-000000000004', 'Digital Product Design', 'Professional', 'Mrs. Jayawardena', 0, 'Explore UX, interface systems, prototyping, and visual communication.', 'Design', 8, 'product-design'),
  ('b0000001-0000-4000-8000-000000000005', 'Data Analytics and Visualization', 'Professional', 'Mrs. Jayawardena', 0, 'Turn data into insight through analytics, dashboards, and storytelling.', 'Data Science', 10, 'data-analytics'),
  ('b0000001-0000-4000-8000-000000000006', 'AI and Future Technologies', 'Professional', 'Vithoosan Sivanathan', 0, 'Discover AI concepts, automation, and innovation trends shaping tomorrow.', 'Emerging Technologies', 12, 'ai-future')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  level = EXCLUDED.level,
  teacher_name = EXCLUDED.teacher_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  duration_months = EXCLUDED.duration_months,
  slug = EXCLUDED.slug;

UPDATE public.site_stats SET courses = 6 WHERE id = 1;

-- >>> END 20240625130000_courses_catalog.sql

-- >>> BEGIN 20240625140000_student_onboarding.sql
-- Student onboarding progress
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_steps jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Students can update their own onboarding fields
CREATE POLICY students_self_update ON public.students
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- >>> END 20240625140000_student_onboarding.sql

-- >>> BEGIN 20240625150000_student_profile_card.sql
-- Student profile card fields
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS card_public BOOLEAN NOT NULL DEFAULT false;

-- Public read for opted-in student cards (no auth required)
CREATE POLICY students_public_card_read ON public.students
  FOR SELECT
  USING (card_public = true);

-- Student avatars storage bucket (public read, student-scoped write)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY avatars_storage_public_read ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

CREATE POLICY avatars_storage_student_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY avatars_storage_student_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY avatars_storage_student_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- >>> END 20240625150000_student_profile_card.sql

-- >>> BEGIN 20240625160000_contact_inquiries.sql
-- Contact form inquiries from marketing site
CREATE TABLE IF NOT EXISTS contact_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  locale text NOT NULL DEFAULT 'en',
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_inquiries_status_idx ON contact_inquiries (status, created_at DESC);

ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can submit contact inquiries"
  ON contact_inquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can read contact inquiries"
  ON contact_inquiries FOR SELECT
  TO authenticated
  USING (is_staff());

CREATE POLICY "Staff can update contact inquiries"
  ON contact_inquiries FOR UPDATE
  TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff());

-- >>> END 20240625160000_contact_inquiries.sql

-- >>> BEGIN 20240625160100_admin_audit_log.sql
-- Admin action audit trail
CREATE TABLE IF NOT EXISTS admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_actions_user_idx ON admin_actions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_actions_created_idx ON admin_actions (created_at DESC);

ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read audit log"
  ON admin_actions FOR SELECT
  TO authenticated
  USING (is_staff());

CREATE POLICY "Staff can insert audit log"
  ON admin_actions FOR INSERT
  TO authenticated
  WITH CHECK (is_staff() AND user_id = auth.uid());

-- >>> END 20240625160100_admin_audit_log.sql

-- >>> BEGIN 20240625160200_certificates_verify.sql
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS verify_code TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS certificates_verify_code_idx ON public.certificates (verify_code);

-- Teacher course assignments for scoped staff access
ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS course_ids UUID[] NOT NULL DEFAULT '{}';

-- >>> END 20240625160200_certificates_verify.sql

-- >>> BEGIN 20240625160300_platform_settings.sql
-- Singleton platform settings (online payments toggle, default tuition)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  online_payments_enabled BOOLEAN NOT NULL DEFAULT false,
  default_tuition_lkr NUMERIC(12, 2) NOT NULL DEFAULT 5000,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.platform_settings (id, online_payments_enabled, default_tuition_lkr)
VALUES (1, false, 5000)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY platform_settings_public_read
  ON public.platform_settings FOR SELECT
  USING (true);

CREATE POLICY platform_settings_admin_write
  ON public.platform_settings FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- >>> END 20240625160300_platform_settings.sql

-- >>> BEGIN 20240625170000_student_registration_fields.sql
-- Extended student registration fields
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS index_number text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS notify_email boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS students_username_lower_idx
  ON public.students (lower(username))
  WHERE username IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS students_index_number_lower_idx
  ON public.students (lower(index_number))
  WHERE index_number IS NOT NULL;

-- >>> END 20240625170000_student_registration_fields.sql

-- >>> BEGIN 20240625180000_fix_handle_new_user_student_provision.sql
-- Profile-only auto-provision on signup; student rows are created by the app layer
-- so public registration can store username, index number, course, etc.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role public.user_role := 'student';
  display_name TEXT;
BEGIN
  IF NEW.raw_app_meta_data ? 'role' THEN
    assigned_role := (NEW.raw_app_meta_data->>'role')::public.user_role;
  END IF;

  display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1));

  INSERT INTO public.profiles (id, email, display_name, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    display_name,
    assigned_role,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- >>> END 20240625180000_fix_handle_new_user_student_provision.sql

-- >>> BEGIN 20240625190000_student_exam_year_ict_grade.sql
-- A/L exam year and optional O/L ICT grade level for student registration
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS exam_year text,
  ADD COLUMN IF NOT EXISTS ict_grade text;

-- >>> END 20240625190000_student_exam_year_ict_grade.sql

-- >>> BEGIN 20240625200000_student_nic_number.sql
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS nic_number text;

CREATE UNIQUE INDEX IF NOT EXISTS students_nic_number_lower_idx
  ON public.students (lower(nic_number))
  WHERE nic_number IS NOT NULL;

-- >>> END 20240625200000_student_nic_number.sql

-- >>> BEGIN 20240625210000_marketing_coming_soon.sql
-- Admin toggle: blur homepage sections below hero with "Coming Soon" overlay
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS marketing_coming_soon_enabled BOOLEAN NOT NULL DEFAULT true;

UPDATE public.platform_settings
SET marketing_coming_soon_enabled = true
WHERE id = 1;

-- >>> END 20240625210000_marketing_coming_soon.sql

-- >>> BEGIN 20240625220000_site_public_mode.sql
-- Site-wide public mode: live, coming_soon, or maintenance (admin-controlled)
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS site_public_mode TEXT NOT NULL DEFAULT 'live'
  CHECK (site_public_mode IN ('live', 'coming_soon', 'maintenance'));

UPDATE public.platform_settings
SET site_public_mode = 'live'
WHERE id = 1;

-- >>> END 20240625220000_site_public_mode.sql

-- >>> BEGIN 20240626120000_seo_unblock_and_faqs.sql
-- SEO FAQ content + keep site live (homepage Coming Soon overlay stays admin-controlled)
UPDATE public.platform_settings
SET site_public_mode = 'live'
WHERE id = 1;

-- Bilingual + Sinhala FAQ columns for AEO
ALTER TABLE public.faqs
  ADD COLUMN IF NOT EXISTS question_ta TEXT,
  ADD COLUMN IF NOT EXISTS answer_ta TEXT,
  ADD COLUMN IF NOT EXISTS question_si TEXT,
  ADD COLUMN IF NOT EXISTS answer_si TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS target_keyword TEXT;

-- Sri Lanka ICT SEO FAQs (EN + TA + SI)
INSERT INTO public.faqs (question, answer, question_ta, answer_ta, question_si, answer_si, category, target_keyword, sort_order)
VALUES
  (
    'What is the best way to study O/L ICT in Sri Lanka?',
    'ICTF (ICT Foundation) offers structured O/L ICT classes via live Zoom sessions, past paper practice at islandwide paper centers, and an online student portal with video lessons and revision materials. Students across all districts can enroll online.',
    'இலங்கையில் O/L ICT படிப்பதற்கான சிறந்த வழி என்ன?',
    'ICTF (ICT அடித்தளம்) நேரடி Zoom வகுப்புகள், தீவு முழுவதும் பேப்பர் மையங்களில் பயிற்சி, வீடியோ பாடங்கள் மற்றும் மறுபரிசீலனை பொருட்களுடன் கட்டமைக்கப்பட்ட O/L ICT வகுப்புகளை வழங்குகிறது.',
    'ශ්‍රී ලංකාවේ O/L ICT අධ්‍යයනය කිරීමට හොඳම ක්‍රමය කුමක්ද?',
    'ICTF (ICT Foundation) සජීවී Zoom පන්ති, දිවයින පුරා ප්‍රශ්න පත්‍ර මධ්‍යස්ථාන, වීඩියෝ පාඩම් සහ නැවත පුහුණු ද්‍රව්‍ය සහිත සංවිධානාත්මක O/L ICT පන්ති ලබා දෙයි.',
    'ol-ict',
    'O/L ICT classes Sri Lanka',
    10
  ),
  (
    'Does ICTF offer A/L ICT online classes via Zoom?',
    'Yes. ICTF delivers A/L ICT tuition through live Zoom classes led by experienced faculty, including revision programs, past paper discussions, and access to the ICTF Student Portal for notes and recordings.',
    'ICTF A/L ICT ஆன்லைன் Zoom வகுப்புகளை வழங்குகிறதா?',
    'ஆம். ICTF அனுபவமுள்ள ஆசிரியர்களால் நடத்தப்படும் நேரடி Zoom வகுப்புகள், மறுபரிசீலனை நிரல்கள், குறிப்புகள் மற்றும் பதிவுகளுக்கான ICTF மாணவர் தளம் வழியாக A/L ICT பயிற்சியை வழங்குகிறது.',
    'ICTF A/L ICT Zoom මගින් අන්තර්ජාල පන්ති ලබා දෙනවාද?',
    'ඔව්. ICTF අත්දැකීම් සහිත ගුරුවරුන් විසින් සජීවී Zoom පන්ති, නැවත පුහුණු වැඩසටහන් සහ ICTF ශිෂ්‍ය ද්වාරය හරහා A/L ICT ටියුෂන් ලබා දෙයි.',
    'al-ict',
    'A/L ICT tuition Sri Lanka Zoom',
    11
  ),
  (
    'Where are ICTF paper centers in Sri Lanka?',
    'ICTF operates a growing islandwide paper center network across districts including Jaffna, Colombo, Kandy, Kurunegala, Gampaha, and more. Visit ictf.lk/network/paper-centers or contact us on WhatsApp +94 77 459 1161 for your nearest center.',
    'இலங்கையில் ICTF பேப்பர் மையங்கள் எங்கே உள்ளன?',
    'ICTF யாழ்ப்பாணம், கொழும்பு, கண்டி, குருணாகலை, கம்பஹா உள்ளிட்ட மாவட்டங்களில் தீவு முழுவதும் பேப்பர் மைய நெட்வொர்க்கை இயக்குகிறது. ictf.lk/network/paper-centers பார்வையிடுங்கள்.',
    'ශ්‍රී ලංකාවේ ICTF ප්‍රශ්න පත්‍ර මධ්‍යස්ථාන කොහේද?',
    'ICTF යාපනය, කොළඹ, මහනුවර, කුරුණෑගල, ගම්පහ ඇතුළු දිස්ත්‍රික්කවල දිවයින පුරා මධ්‍යස්ථාන ජාලයක් පවත්වයි. ictf.lk/network/paper-centers බලන්න.',
    'centers',
    'ICT paper classes Sri Lanka',
    12
  ),
  (
    'How much does ICT tuition cost in Sri Lanka at ICTF?',
    'ICTF tuition fees are priced in Sri Lankan Rupees (LKR). Fees vary by program (O/L ICT, A/L ICT, or degree pathways). Register at ictf.lk/register or WhatsApp +94 77 459 1161 for current batch fees and payment plans.',
    'ICTF-ல் இலங்கையில் ICT பயிற்சி கட்டணம் எவ்வளவு?',
    'ICTF கட்டணங்கள் இலங்கை ரூபாயில் (LKR) வழங்கப்படுகின்றன. O/L ICT, A/L ICT அல்லது பட்ட நிரல்களுக்கு கட்டணம் மாறுபடும். ictf.lk/register-ல் பதிவு செய்யுங்கள்.',
    'ICTF හි ශ්‍රී ලංකාවේ ICT ටියුෂන් ගාස්තු කීයද?',
    'ICTF ගාස්තු ශ්‍රී ලංකා රුපියල් (LKR) වලින් ගණනය කරයි. O/L ICT, A/L ICT හෝ උපාධි මාර්ග අනුව වෙනස් වේ. ictf.lk/register හරහා ලියාපදිංචි වන්න.',
    'fees',
    'ICT tuition fees Sri Lanka LKR',
    13
  ),
  (
    'Can I study ICT from Jaffna, Colombo, or other districts?',
    'Yes. ICTF is headquartered in Jaffna and serves students islandwide through online Zoom classes and local paper centers. Whether you are in Jaffna, Colombo, Kandy, or any district, you can enroll and learn with ICTF.',
    'யாழ்ப்பாணம், கொழும்பு அல்லது பிற மாவட்டங்களிலிருந்து ICT படிக்க முடியுமா?',
    'ஆம். ICTF யாழ்ப்பாணத்தில் அமைந்துள்ளது மற்றும் ஆன்லைன் Zoom வகுப்புகள் மற்றும் உள்ளூர் பேப்பர் மையங்கள் மூலம் தீவு முழுவதும் மாணவர்களுக்கு சேவை செய்கிறது.',
    'යාපනය, කොළඹ හෝ වෙනත් දිස්ත්‍රික්කවලින් ICT අධ්‍යයනය කළ හැකිද?',
    'ඔව්. ICTF යාපනයේ ප්‍රධාන කාර්යාලය සහිත අතර Zoom පන්ති සහ දේශීය මධ්‍යස්ථාන හරහා දිවයින පුරා ශිෂ්‍යයින්ට සේවය කරයි.',
    'geo',
    'ICT tuition Jaffna Colombo Sri Lanka',
    14
  ),
  (
    'Who founded ICTF and teaches ICT?',
    'ICT Foundation (ICTF) was founded by Vithoosan Sivanathan, an experienced ICT educator in Sri Lanka known for producing top O/L and A/L ICT examination results including island ranks.',
    'ICTF-ஐ யார் நிறுவினார் மற்றும் ICT கற்பிக்கிறார்?',
    'ICT அடித்தளத்தை (ICTF) விதூசன் சிவநாதன் நிறுவினார் — இலங்கையில் O/L மற்றும் A/L ICT தேர்வு முடிவுகளில் தீவு தரவரிசைகள் உட்பட சிறந்த முடிவுகளை உருவாக்கிய அனுபவமுள்ள ICT கல்வியாளர்.',
    'ICTF නිර්මාණය කළේ කවුද?',
    'ICT Foundation (ICTF) විසින් Vithoosan Sivanathan නිර්මාණය කරන ලදී — ශ්‍රී ලංකාවේ O/L සහ A/L ICT විභාග සාර්ථකත්වය සහ දිවයින ශ්‍රේණිගත කිරීම් සමඟ ප්‍රසිද්ධ ICT අධ්‍යාපනිකයෙක්.',
    'founder',
    'Vithoosan Sivanathan ICT teacher Sri Lanka',
    15
  ),
  (
    'How do I register for ICTF ICT classes?',
    'Register online at ictf.lk/register with your name, email, study program (O/L or A/L ICT), and contact details. You can also WhatsApp +94 77 459 1161 with your name, grade, and district to complete enrollment.',
    'ICTF ICT வகுப்புகளுக்கு எப்படி பதிவு செய்வது?',
    'ictf.lk/register-ல் உங்கள் பெயர், மின்னஞ்சல், படிப்பு நிரல் (O/L அல்லது A/L ICT) மற்றும் தொடர்பு விவரங்களுடன் ஆன்லைனில் பதிவு செய்யுங்கள். WhatsApp +94 77 459 1161-லும் தொடர்பு கொள்ளலாம்.',
    'ICTF ICT පන්ති සඳහා ලියාපදිංචි වන්නේ කෙසේද?',
    'ictf.lk/register හරහා ඔබේ නම, විද්‍යුත් තැපෑල, අධ්‍යයන වැඩසටහන (O/L හෝ A/L ICT) සහ සම්බන්ධතා විස්තර සමඟ ලියාපදිංචි වන්න.',
    'register',
    'ICTF register Sri Lanka',
    16
  ),
  (
    'Does ICTF have a student portal for ICT learning?',
    'Yes. The ICTF Student Portal provides video lessons, live class schedules, study resources, exam results, leaderboard, achievements, and an AI study assistant — accessible from any device in Sri Lanka.',
    'ICT ICT கற்றலுக்கு ICTF-க்கு மாணவர் தளம் உள்ளதா?',
    'ஆம். ICTF மாணவர் தளம் வீடியோ பாடங்கள், நேரடி வகுப்பு அட்டவணை, படிப்பு வளங்கள், தேர்வு முடிவுகள், லீடர்போர்டு, சாதனைகள் மற்றும் AI படிப்பு உதவியாளரை வழங்குகிறது.',
    'ICTF හි ICT අධ්‍යයනය සඳහා ශිෂ්‍ය ද්වාරයක් තිබේද?',
    'ඔව්. ICTF ශිෂ්‍ය ද්වාරය වීඩියෝ පාඩම්, සජීවී පන්ති කාලසටහන්, අධ්‍යයන සම්පත්, විභාග ප්‍රතිඵල, නායක පුවරුව සහ AI අධ්‍යයන සහායක ලබා දෙයි.',
    'portal',
    'ICT student portal Sri Lanka',
    17
  )
ON CONFLICT DO NOTHING;

-- >>> END 20240626120000_seo_unblock_and_faqs.sql

-- >>> BEGIN 20240626130000_restore_marketing_coming_soon.sql
-- Restore homepage Coming Soon overlay (sections below hero)
UPDATE public.platform_settings
SET marketing_coming_soon_enabled = true
WHERE id = 1;

-- >>> END 20240626130000_restore_marketing_coming_soon.sql

-- >>> BEGIN 20240627120000_rename_tuition_to_institute_fee.sql
-- Rename default tuition fee column to institute fee terminology
ALTER TABLE public.platform_settings
  RENAME COLUMN default_tuition_lkr TO default_institute_fee_lkr;

-- >>> END 20240627120000_rename_tuition_to_institute_fee.sql

-- >>> BEGIN 20240627120100_faq_institute_terminology.sql
-- Replace tuition terminology in SEO FAQs with institute terminology
UPDATE public.faqs
SET
  answer = 'Yes. ICTF delivers A/L ICT institute programs through live Zoom classes led by experienced faculty, including revision programs, past paper discussions, and access to the ICTF Student Portal for notes and recordings.',
  answer_ta = 'ஆம். ICTF அனுபவமுள்ள ஆசிரியர்களால் நடத்தப்படும் நேரடி Zoom வகுப்புகள், மறுபரிசீலனை நிரல்கள், குறிப்புகள் மற்றும் பதிவுகளுக்கான ICTF மாணவர் தளம் வழியாக A/L ICT நிறுவனத்தை வழங்குகிறது.',
  answer_si = 'ඔව්. ICTF අත්දැකීම් සහිත ගුරුවරුන් විසින් සජීවී Zoom පන්ති, නැවත පුහුණු වැඩසටහන් සහ ICTF ශිෂ්‍ය ද්වාරය හරහා A/L ICT ආයතනය ලබා දෙයි.',
  target_keyword = 'A/L ICT institute Sri Lanka Zoom'
WHERE target_keyword = 'A/L ICT tuition Sri Lanka Zoom';

UPDATE public.faqs
SET
  question = 'How much does ICT institute cost in Sri Lanka at ICTF?',
  answer = 'ICTF institute fees are priced in Sri Lankan Rupees (LKR). Fees vary by program (O/L ICT, A/L ICT, or degree pathways). Register at ictf.lk/register or WhatsApp +94 77 459 1161 for current batch fees and payment plans.',
  question_ta = 'ICTF-ல் இலங்கையில் ICT நிறுவன கட்டணம் எவ்வளவு?',
  answer_ta = 'ICTF கட்டணங்கள் இலங்கை ரூபாயில் (LKR) வழங்கப்படுகின்றன. O/L ICT, A/L ICT அல்லது பட்ட நிரல்களுக்கு கட்டணம் மாறுபடும். ictf.lk/register-ல் பதிவு செய்யுங்கள்.',
  question_si = 'ICTF හි ශ්‍රී ලංකාවේ ICT ආයතන ගාස්තු කීයද?',
  answer_si = 'ICTF ගාස්තු ශ්‍රී ලංකා රුපියල් (LKR) වලින් ගණනය කරයි. O/L ICT, A/L ICT හෝ උපාධි මාර්ග අනුව වෙනස් වේ. ictf.lk/register හරහා ලියාපදිංචි වන්න.',
  target_keyword = 'ICT institute fees Sri Lanka LKR'
WHERE target_keyword = 'ICT tuition fees Sri Lanka LKR';

UPDATE public.faqs
SET target_keyword = 'ICT institute Jaffna Colombo Sri Lanka'
WHERE target_keyword = 'ICT tuition Jaffna Colombo Sri Lanka';

-- >>> END 20240627120100_faq_institute_terminology.sql

-- >>> BEGIN 20240628120000_marketing_announcements.sql
-- Marketing announcement popups for public site

CREATE TABLE public.marketing_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  cta_label TEXT NOT NULL DEFAULT '',
  cta_url TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL DEFAULT 'text_only'
    CHECK (content_type IN ('image_only', 'text_only', 'text_image', 'text_image_link')),
  display_style TEXT NOT NULL DEFAULT 'card'
    CHECK (display_style IN ('minimal', 'card', 'image_hero', 'promo')),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  priority INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX marketing_announcements_active_schedule_idx
  ON public.marketing_announcements (is_active, priority DESC, created_at DESC);

ALTER TABLE public.marketing_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY marketing_announcements_public_read
  ON public.marketing_announcements FOR SELECT
  USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now())
  );

CREATE POLICY marketing_announcements_admin_write
  ON public.marketing_announcements FOR ALL
  USING (public.is_admin());

-- >>> END 20240628120000_marketing_announcements.sql

-- >>> BEGIN 20240628130000_brand_logo_settings.sql
-- Admin-managed marketing nav & footer logo dimensions
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS brand_logo_settings JSONB NOT NULL DEFAULT '{
    "nav": { "widthRem": 10.75, "scale": 1.22, "scaleSm": 1.26 },
    "footer": { "widthRem": 13.5, "heightRem": 4.25, "widthRemSm": 14, "heightRemSm": 4.5 }
  }'::jsonb;

-- >>> END 20240628130000_brand_logo_settings.sql

-- >>> BEGIN 20240628130100_brand_logo_size_defaults.sql
-- Larger default nav/footer logo sizes for clearer visibility
UPDATE public.platform_settings
SET brand_logo_settings = '{
  "nav": { "widthRem": 12.5, "scale": 1.34, "scaleSm": 1.4 },
  "footer": { "widthRem": 20, "heightRem": 6.25, "widthRemSm": 22, "heightRemSm": 6.75 }
}'::jsonb
WHERE id = 1;

-- >>> END 20240628130100_brand_logo_size_defaults.sql

-- >>> BEGIN 20240628130200_brand_logo_size_optimal.sql
-- Optimal default logo sizes for header/footer visibility
UPDATE public.platform_settings
SET brand_logo_settings = '{
  "nav": { "widthRem": 13.75, "scale": 1.38, "scaleSm": 1.44 },
  "footer": { "widthRem": 19, "heightRem": 7.5, "widthRemSm": 24, "heightRemSm": 8 }
}'::jsonb
WHERE id = 1;

-- Enable Realtime for live logo size updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'platform_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_settings;
  END IF;
END $$;

-- >>> END 20240628130200_brand_logo_size_optimal.sql

-- >>> BEGIN 20240628130300_footer_logo_compact.sql
-- Compact footer logo: smaller size, left-aligned with brand copy
UPDATE public.platform_settings
SET brand_logo_settings = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(brand_logo_settings, '{}'::jsonb),
        '{footer,widthRem}',
        '11'::jsonb
      ),
      '{footer,heightRem}',
      '3.5'::jsonb
    ),
    '{footer,widthRemSm}',
    '12.5'::jsonb
  ),
  '{footer,heightRemSm}',
  '4'::jsonb
)
WHERE id = 1;

-- >>> END 20240628130300_footer_logo_compact.sql

-- >>> BEGIN 20240628130400_footer_logo_larger.sql
-- Larger footer logo defaults (left-aligned, prominent but not full-bleed)
UPDATE public.platform_settings
SET brand_logo_settings = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(brand_logo_settings, '{}'::jsonb),
        '{footer,widthRem}',
        '15'::jsonb
      ),
      '{footer,heightRem}',
      '5'::jsonb
    ),
    '{footer,widthRemSm}',
    '18'::jsonb
  ),
  '{footer,heightRemSm}',
  '6'::jsonb
)
WHERE id = 1;

-- >>> END 20240628130400_footer_logo_larger.sql

-- >>> BEGIN 20240628130500_footer_logo_small.sql
-- Compact footer logo: slightly larger than nav, left-aligned
UPDATE public.platform_settings
SET brand_logo_settings = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(brand_logo_settings, '{}'::jsonb),
        '{footer,widthRem}',
        '11.5'::jsonb
      ),
      '{footer,heightRem}',
      '3.25'::jsonb
    ),
    '{footer,widthRemSm}',
    '12.5'::jsonb
  ),
  '{footer,heightRemSm}',
  '3.5'::jsonb
)
WHERE id = 1;

-- >>> END 20240628130500_footer_logo_small.sql

-- >>> BEGIN 20240628130600_footer_logo_db_driven_defaults.sql
-- Footer/nav logo sizes controlled via platform_settings.brand_logo_settings
-- (admin panel + CSS variables). Replaces compact overrides from prior migrations.
UPDATE public.platform_settings
SET brand_logo_settings = '{
  "nav": { "widthRem": 12.5, "scale": 1.05, "scaleSm": 1.1 },
  "footer": { "widthRem": 17, "heightRem": 5, "widthRemSm": 19, "heightRemSm": 5.5 }
}'::jsonb
WHERE id = 1;

-- >>> END 20240628130600_footer_logo_db_driven_defaults.sql

-- >>> BEGIN 20240628130700_footer_logo_compact_restore.sql
-- Compact footer logo: balanced with brand copy below (left-aligned)
UPDATE public.platform_settings
SET brand_logo_settings = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(brand_logo_settings, '{}'::jsonb),
        '{footer,widthRem}',
        '11.5'::jsonb
      ),
      '{footer,heightRem}',
      '3.25'::jsonb
    ),
    '{footer,widthRemSm}',
    '12.5'::jsonb
  ),
  '{footer,heightRemSm}',
  '3.5'::jsonb
)
WHERE id = 1;

-- >>> END 20240628130700_footer_logo_compact_restore.sql

-- >>> BEGIN 20240628130800_marketing_announcements_banner_check.sql
-- Drop the existing constraint and recreate it to support the new 'banner' display style.
ALTER TABLE public.marketing_announcements
  DROP CONSTRAINT IF EXISTS marketing_announcements_display_style_check;

ALTER TABLE public.marketing_announcements
  ADD CONSTRAINT marketing_announcements_display_style_check
  CHECK (display_style IN ('minimal', 'card', 'image_hero', 'promo', 'banner'));

-- >>> END 20240628130800_marketing_announcements_banner_check.sql

-- >>> BEGIN 20240628140000_blog_posts.sql
-- Blog categories and posts for marketing CMS

CREATE TABLE public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT NOT NULL DEFAULT '',
  category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  seo_title TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  author_name TEXT NOT NULL DEFAULT '',
  reading_time_minutes INT NOT NULL DEFAULT 1,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX blog_posts_slug_idx ON public.blog_posts (slug);
CREATE INDEX blog_posts_status_published_idx ON public.blog_posts (status, published_at DESC NULLS LAST);
CREATE INDEX blog_posts_category_status_idx ON public.blog_posts (category_id, status, published_at DESC NULLS LAST);
CREATE INDEX blog_posts_featured_idx ON public.blog_posts (is_featured, published_at DESC NULLS LAST);
CREATE INDEX blog_categories_slug_idx ON public.blog_categories (slug);

CREATE OR REPLACE FUNCTION public.set_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_blog_posts_updated_at();

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY blog_categories_public_read
  ON public.blog_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY blog_categories_admin_write
  ON public.blog_categories FOR ALL
  USING (public.is_admin());

CREATE POLICY blog_posts_public_read
  ON public.blog_posts FOR SELECT
  USING (
    status = 'published'
    AND published_at IS NOT NULL
    AND published_at <= now()
  );

CREATE POLICY blog_posts_admin_write
  ON public.blog_posts FOR ALL
  USING (public.is_admin());

-- >>> END 20240628140000_blog_posts.sql

