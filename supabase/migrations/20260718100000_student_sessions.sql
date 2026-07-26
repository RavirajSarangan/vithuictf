-- Single active session enforcement for students: one row per login, the
-- newest non-revoked row is the "current" session. A partial unique index
-- guarantees at most one active row per student at the DB level. Middleware
-- compares an httpOnly cookie marker against this table on every student
-- page load and force-logs-out any browser holding a stale marker (new
-- login elsewhere, manual logout, or admin force-logout).

CREATE TABLE public.student_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_row_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  session_marker UUID NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  device_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT CHECK (revoked_reason IN ('new_login', 'manual_logout', 'admin_force', 'expired'))
);

-- Enforces "at most one active session per student" at the database level,
-- not just in application logic.
CREATE UNIQUE INDEX student_sessions_one_active_idx
  ON public.student_sessions (user_id) WHERE revoked_at IS NULL;

CREATE INDEX student_sessions_user_id_idx ON public.student_sessions (user_id, created_at DESC);
CREATE INDEX student_sessions_student_row_id_idx ON public.student_sessions (student_row_id, created_at DESC);

ALTER TABLE public.student_sessions ENABLE ROW LEVEL SECURITY;

-- This table holds IP/device PII and is itself a security control, so it
-- gets the strictest posture in the schema: no client role (including an
-- admin's own browser) may read or write it directly. Mirrors
-- rate_limit_buckets_no_client. Admin reads/writes go through
-- createAdminClient() (service role, bypasses RLS) in Server Actions.
CREATE POLICY student_sessions_no_client ON public.student_sessions
FOR ALL USING (false);

-- Called by middleware via the request-bound (RLS-enforced) client on every
-- student page load. SECURITY DEFINER lets it read/update despite the
-- deny-all policy above; auth.uid() keeps the check scoped to the caller's
-- own row so a marker can't be probed cross-user. Atomically checks and
-- touches last_seen_at in one statement.
CREATE OR REPLACE FUNCTION public.touch_student_session(p_session_marker UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_found BOOLEAN;
BEGIN
  IF p_session_marker IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.student_sessions
  SET last_seen_at = now()
  WHERE session_marker = p_session_marker
    AND user_id = auth.uid()
    AND revoked_at IS NULL
  RETURNING true INTO v_found;

  RETURN COALESCE(v_found, false);
END;
$$;

REVOKE ALL ON FUNCTION public.touch_student_session(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.touch_student_session(UUID) TO authenticated;
