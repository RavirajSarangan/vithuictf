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
