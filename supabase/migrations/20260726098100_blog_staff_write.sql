-- Extend blog write access from admin-only to any staff member (admin,
-- super_admin, or teacher) — teacher access is further gated at the
-- application layer by the new "blog" per-teacher feature toggle
-- (requireFeatureAccess("blog") in src/lib/actions/admin.ts). This is a
-- pure superset: admin/super_admin behavior is unchanged.

DROP POLICY IF EXISTS blog_posts_admin_write ON public.blog_posts;
CREATE POLICY blog_posts_admin_write ON public.blog_posts
  FOR ALL USING (public.is_staff());

DROP POLICY IF EXISTS blog_categories_admin_write ON public.blog_categories;
CREATE POLICY blog_categories_admin_write ON public.blog_categories
  FOR ALL USING (public.is_staff());
