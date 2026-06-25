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
