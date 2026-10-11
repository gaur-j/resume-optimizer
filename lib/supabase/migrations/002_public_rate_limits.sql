-- ============================================================
-- 002_public_rate_limits.sql
-- Shared rate limiting for UNAUTHENTICATED routes
-- (/api/preview-score, /api/public-extract-pdf).
-- Run ONCE in the Supabase SQL editor BEFORE deploying the matching code.
-- Idempotent: safe to re-run.
--
-- Replaces the in-memory Map limiter (per-serverless-instance, so it never
-- actually limited anything) with counters in Postgres that all instances share.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.ip_rate_limits (
  key TEXT NOT NULL,            -- keyed hash of the client IP, or 'global'
  action TEXT NOT NULL,         -- e.g. 'preview-score:600'
  window_start TIMESTAMPTZ NOT NULL,
  request_count INT NOT NULL DEFAULT 1,
  PRIMARY KEY (key, action, window_start)
);

CREATE INDEX IF NOT EXISTS ip_rate_limits_window_start_idx
  ON public.ip_rate_limits (window_start);

-- RLS on with NO policies + no grants: only the service role (which bypasses
-- RLS) and the SECURITY DEFINER function below can touch this table.
ALTER TABLE public.ip_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ip_rate_limits FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.check_ip_rate_limit(
  p_key TEXT,
  p_action TEXT,
  p_max_requests INT,
  p_window_seconds INT
) RETURNS TABLE (allowed BOOLEAN, retry_after_seconds INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_count INT;
BEGIN
  IF p_window_seconds <= 0 OR p_max_requests <= 0 THEN
    RAISE EXCEPTION 'Invalid rate limit parameters';
  END IF;

  v_window_start := to_timestamp(
    floor(extract(epoch FROM NOW()) / p_window_seconds) * p_window_seconds
  );

  -- Opportunistic cleanup (about 1% of calls) so the table can't grow forever.
  IF random() < 0.01 THEN
    DELETE FROM public.ip_rate_limits
    WHERE window_start < NOW() - INTERVAL '2 days';
  END IF;

  INSERT INTO public.ip_rate_limits (key, action, window_start, request_count)
  VALUES (p_key, p_action, v_window_start, 1)
  ON CONFLICT (key, action, window_start)
  DO UPDATE SET request_count = public.ip_rate_limits.request_count + 1
  RETURNING request_count INTO v_count;

  IF v_count > p_max_requests THEN
    RETURN QUERY SELECT
      FALSE,
      GREATEST(
        1,
        p_window_seconds - floor(extract(epoch FROM NOW() - v_window_start))::INT
      );
  ELSE
    RETURN QUERY SELECT TRUE, 0;
  END IF;
END;
$$;

-- Server-only: the public routes call this through the service-role client.
REVOKE ALL ON FUNCTION public.check_ip_rate_limit(TEXT, TEXT, INT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_ip_rate_limit(TEXT, TEXT, INT, INT) TO service_role;

COMMIT;