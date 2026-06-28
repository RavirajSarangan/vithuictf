-- ICTF Social Media Tracking Dashboard (schema — role enum added in prior migration)

CREATE TYPE public.social_performance AS ENUM ('up', 'down', 'stable');

-- Security helpers
CREATE OR REPLACE FUNCTION public.is_content_manager()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'content_manager'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_tracking_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'content_manager')
  );
$$;

-- Content team staff extension
CREATE TABLE public.content_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX content_managers_user_id_idx ON public.content_managers(user_id);
CREATE INDEX content_managers_active_idx ON public.content_managers(active);

-- Reference: social platforms
CREATE TABLE public.social_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

-- Reference: content types
CREATE TABLE public.social_content_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

-- Weekly tracking periods (week_start = Monday)
CREATE TABLE public.social_tracking_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX social_tracking_weeks_week_start_idx ON public.social_tracking_weeks(week_start DESC);

-- Daily content checklist entries
CREATE TABLE public.social_content_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID NOT NULL REFERENCES public.social_tracking_weeks(id) ON DELETE CASCADE,
  content_type_id UUID NOT NULL REFERENCES public.social_content_types(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  posted BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (week_id, content_type_id, day_of_week)
);

CREATE INDEX social_content_entries_week_idx ON public.social_content_entries(week_id);

-- Follower metrics per platform per week
CREATE TABLE public.social_follower_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID NOT NULL REFERENCES public.social_tracking_weeks(id) ON DELETE CASCADE,
  platform_id UUID NOT NULL REFERENCES public.social_platforms(id) ON DELETE CASCADE,
  previous_count INT NOT NULL DEFAULT 0 CHECK (previous_count >= 0),
  current_count INT NOT NULL DEFAULT 0 CHECK (current_count >= 0),
  performance public.social_performance,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (week_id, platform_id)
);

CREATE INDEX social_follower_metrics_week_idx ON public.social_follower_metrics(week_id);

-- RLS
ALTER TABLE public.content_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_content_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_tracking_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_content_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_follower_metrics ENABLE ROW LEVEL SECURITY;

-- content_managers: admin full access; content managers read own row
CREATE POLICY content_managers_admin_all ON public.content_managers
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY content_managers_self_select ON public.content_managers
  FOR SELECT USING (user_id = auth.uid());

-- social reference tables: tracking staff read; admin write
CREATE POLICY social_platforms_select ON public.social_platforms
  FOR SELECT USING (public.is_tracking_staff());

CREATE POLICY social_platforms_admin_write ON public.social_platforms
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY social_content_types_select ON public.social_content_types
  FOR SELECT USING (public.is_tracking_staff());

CREATE POLICY social_content_types_admin_write ON public.social_content_types
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- tracking weeks
CREATE POLICY social_tracking_weeks_select ON public.social_tracking_weeks
  FOR SELECT USING (public.is_tracking_staff());

CREATE POLICY social_tracking_weeks_insert ON public.social_tracking_weeks
  FOR INSERT WITH CHECK (public.is_tracking_staff());

CREATE POLICY social_tracking_weeks_delete ON public.social_tracking_weeks
  FOR DELETE USING (public.is_admin());

-- content entries
CREATE POLICY social_content_entries_select ON public.social_content_entries
  FOR SELECT USING (public.is_tracking_staff());

CREATE POLICY social_content_entries_insert ON public.social_content_entries
  FOR INSERT WITH CHECK (public.is_tracking_staff());

CREATE POLICY social_content_entries_update ON public.social_content_entries
  FOR UPDATE USING (public.is_tracking_staff()) WITH CHECK (public.is_tracking_staff());

-- follower metrics
CREATE POLICY social_follower_metrics_select ON public.social_follower_metrics
  FOR SELECT USING (public.is_tracking_staff());

CREATE POLICY social_follower_metrics_insert ON public.social_follower_metrics
  FOR INSERT WITH CHECK (public.is_tracking_staff());

CREATE POLICY social_follower_metrics_update ON public.social_follower_metrics
  FOR UPDATE USING (public.is_tracking_staff()) WITH CHECK (public.is_tracking_staff());

-- Seed platforms (matching spreadsheet)
INSERT INTO public.social_platforms (slug, name, sort_order) VALUES
  ('youtube', 'Youtube Channel', 1),
  ('facebook', 'Facebook Page', 2),
  ('instagram', 'Instagram Followers', 3),
  ('tiktok', 'Tiktok Followers', 4),
  ('whatsapp', 'WhatsApp Channel Members', 5);

-- Seed content types
INSERT INTO public.social_content_types (slug, name, sort_order) VALUES
  ('youtube_video', 'Youtube Video', 1),
  ('youtube_shorts', 'Youtube Shorts', 2),
  ('tiktok_video', 'Tiktok Video', 3),
  ('insta_reel', 'Insta Reel', 4);
