-- Durable rate limiting for abuse-prone endpoints (contact, auth, blog views, etc.)

CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  bucket_key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  hit_count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (bucket_key, window_start)
);

ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;

-- No direct client access; only SECURITY DEFINER RPC.
CREATE POLICY rate_limit_buckets_no_client ON public.rate_limit_buckets
FOR ALL
USING (false);

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT,
  p_max INTEGER,
  p_window_seconds INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  IF p_key IS NULL OR length(trim(p_key)) = 0 OR p_max < 1 OR p_window_seconds < 1 THEN
    RETURN false;
  END IF;

  v_window_start := to_timestamp(
    floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds
  );

  INSERT INTO public.rate_limit_buckets (bucket_key, window_start, hit_count)
  VALUES (p_key, v_window_start, 1)
  ON CONFLICT (bucket_key, window_start)
  DO UPDATE SET hit_count = rate_limit_buckets.hit_count + 1
  RETURNING hit_count INTO v_count;

  RETURN v_count <= p_max;
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;
