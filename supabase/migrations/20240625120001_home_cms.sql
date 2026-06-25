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
