-- Public result-check links: one shareable URL per course that lets students
-- self-serve their own exam results by submitting their username + student ID.
-- Mirrors the shape of certificate_claim_links (20260714090000).

CREATE TABLE public.result_check_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  course_name TEXT NOT NULL,
  batch_id UUID REFERENCES public.course_batches(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
  max_lookups INT,
  lookup_count INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX result_check_links_status_idx ON public.result_check_links (status);

ALTER TABLE public.result_check_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY result_check_links_staff ON public.result_check_links
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- Public/anon may look up an active link by slug so the check page can render
-- course context without a session. The actual student lookup always goes
-- through the service-role client in a public server action, never this policy.
CREATE POLICY result_check_links_public_select ON public.result_check_links
  FOR SELECT USING (status = 'active');
