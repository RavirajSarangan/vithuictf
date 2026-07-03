-- Facebook, LinkedIn, and Website Blog rows on the daily content checklist
INSERT INTO public.social_content_types (slug, name, sort_order) VALUES
  ('facebook_post', 'Facebook Post', 5),
  ('linkedin_post', 'LinkedIn Post', 6),
  ('website_blog', 'Website Blog', 7)
ON CONFLICT (slug) DO NOTHING;
