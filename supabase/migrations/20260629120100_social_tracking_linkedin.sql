INSERT INTO public.social_platforms (slug, name, sort_order)
VALUES ('linkedin', 'LinkedIn Followers', 6)
ON CONFLICT (slug) DO NOTHING;
