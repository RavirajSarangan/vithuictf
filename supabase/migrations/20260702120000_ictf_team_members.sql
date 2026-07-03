-- ICTF Team members: public-facing team profiles managed by super admins

CREATE TABLE IF NOT EXISTS public.ictf_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  photo_url TEXT NOT NULL DEFAULT '',
  facebook_url TEXT NOT NULL DEFAULT '',
  instagram_url TEXT NOT NULL DEFAULT '',
  linkedin_url TEXT NOT NULL DEFAULT '',
  youtube_url TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  is_lead BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ictf_team_members_sort_order_idx
  ON public.ictf_team_members (sort_order);

ALTER TABLE public.ictf_team_members ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous marketing visitors) can read team profiles
CREATE POLICY ictf_team_members_public ON public.ictf_team_members
  FOR SELECT USING (true);

-- Only super admins can create, edit, or delete team profiles
CREATE POLICY ictf_team_members_super_admin_write ON public.ictf_team_members
  FOR ALL USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
