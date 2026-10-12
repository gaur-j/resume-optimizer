-- ============================================================
-- Resume AI Optimizer — Database Schema
-- ============================================================
-- Safe to run on your EXISTING Supabase project: every statement
-- uses IF NOT EXISTS, so it only creates what's missing and will
-- not touch or drop any data you already have.
--
-- This file matches exactly what app/api/*/route.ts reads and
-- writes today (users.scan_credits, users.total_spent_inr,
-- users.total_paid_scans, scans.*, payments.*). Keep this file in
-- sync if you add new columns — it's your source of truth if you
-- ever need to recreate the project from scratch.
-- ============================================================

-- ── users ──────────────────────────────────────────────────
-- One row per authenticated user. Rows are normally created by
-- Supabase's auth trigger below; app/api/user/route.ts also
-- self-heals a missing row on first dashboard load.
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  scan_credits INT NOT NULL DEFAULT 3,
  total_paid_scans INT NOT NULL DEFAULT 0,
  total_spent_inr INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── scans ──────────────────────────────────────────────────
-- One row per resume analysis run through /api/analyze.
CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resume_text TEXT NOT NULL,
  jd_text TEXT NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  ats_score INT,
  result_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── payments ───────────────────────────────────────────────
-- One row per Razorpay order, created by /api/create-order and
-- updated to "success" by /api/verify-payment or the webhook.
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  razorpay_order_id TEXT UNIQUE NOT NULL,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount_inr INT NOT NULL,
  scan_credits_granted INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'success', 'failed')),
    attribution JSONB,  -- sanitized utm_source / utm_medium / utm_campaign only
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- For databases created before this column existed (idempotent).
ALTER TABLE payments ADD COLUMN IF NOT EXISTS attribution JSONB;

-- ── referrals (not used by the app yet) ───────────────────
-- Kept ready for the referral growth feature from the roadmap.
-- Safe to leave in place even if unused today.
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own" ON users;
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

--No INSERT/UPDATE policy on users on purpose: clients may only READ their
-- own row. All writes (credits, spend totals) go through SECURITY DEFINER
-- functions or the service-role client. See migrations/001_security_hardening.sql.

DROP POLICY IF EXISTS "users_update_own" ON users;
REVOKE INSERT, UPDATE, DELETE ON users FROM anon, authenticated;
DROP POLICY IF EXISTS "scans_select_own" ON scans;
CREATE POLICY "scans_select_own" ON scans
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "scans_insert_own" ON scans;
CREATE POLICY "scans_insert_own" ON scans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "payments_select_own" ON payments;
CREATE POLICY "payments_select_own" ON payments
  FOR SELECT USING (auth.uid() = user_id);

--Payments are read-only for clients; /api/create-order inserts with the
-- service-role client.

DROP POLICY IF EXISTS "payments_insert_own" ON payments;
REVOKE INSERT, UPDATE, DELETE ON payments FROM anon, authenticated;

DROP POLICY IF EXISTS "referrals_select_own" ON referrals;
CREATE POLICY "referrals_select_own" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Note: writes to payments and users.scan_credits happen server-side only:
-- the service-role client (lib/supabase/admin.ts) bypasses RLS by design, and
-- the SECURITY DEFINER functions below do the atomic credit operations.
-- Never expose the service-role key to the browser.

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS scans_user_id_idx ON scans(user_id);
CREATE INDEX IF NOT EXISTS scans_created_at_idx ON scans(created_at);
CREATE INDEX IF NOT EXISTS payments_user_id_idx ON payments(user_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON payments(status);
CREATE INDEX IF NOT EXISTS payments_razorpay_order_id_idx ON payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS referrals_referrer_id_idx ON referrals(referrer_id);

-- ============================================================
-- Auto-create a users row when someone signs up
-- ============================================================
-- This is a belt-and-suspenders companion to the self-heal logic
-- already in app/api/user/route.ts — with this trigger in place,
-- the self-heal path becomes a fallback rather than the only path.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, scan_credits)
  VALUES (NEW.id, NEW.email, 3)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Keep updated_at current automatically
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_users_updated_at ON users;
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_payments_updated_at ON payments;
CREATE TRIGGER set_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Atomic credit operations (prevents race conditions)
-- ============================================================
-- Guard and update happen in one statement/transaction, serialized at the
-- row level. SECURITY DEFINER because clients have no UPDATE rights on users.
-- consume_scan_credit: signed-in users, own row only (id = auth.uid()).
-- refund_scan_credit / grant_credits_for_order: service role only.

CREATE OR REPLACE FUNCTION public.consume_scan_credit(p_user_id UUID)
RETURNS TABLE (success BOOLEAN, remaining_credits INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remaining INT;
BEGIN
  UPDATE public.users
  SET scan_credits = scan_credits - 1,
      updated_at = NOW()
  WHERE id = p_user_id
    AND id = auth.uid()      -- never let a caller spend someone else's credit
    AND scan_credits > 0
  RETURNING scan_credits INTO v_remaining;

  IF v_remaining IS NULL THEN
    RETURN QUERY
      SELECT FALSE, COALESCE((SELECT scan_credits FROM public.users WHERE id = p_user_id AND id = auth.uid()), 0);
  ELSE
    RETURN QUERY SELECT TRUE, v_remaining;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_scan_credit(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_scan_credit(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.refund_scan_credit(p_user_id UUID)
RETURNS INT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.users
  SET scan_credits = scan_credits + 1,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING scan_credits;
$$;

REVOKE ALL ON FUNCTION public.refund_scan_credit(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_scan_credit(UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.grant_credits_for_order(
  p_order_id TEXT,
  p_payment_id TEXT DEFAULT NULL,
  p_signature TEXT DEFAULT NULL
) RETURNS TABLE (outcome TEXT, payment JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pay public.payments%ROWTYPE;
BEGIN
  UPDATE public.payments p
  SET status = 'success',
      razorpay_payment_id = COALESCE(p_payment_id, p.razorpay_payment_id),
      razorpay_signature = COALESCE(p_signature, p.razorpay_signature),
      updated_at = NOW()
  WHERE p.razorpay_order_id = p_order_id
    AND p.status = 'pending'
  RETURNING * INTO v_pay;

  IF FOUND THEN
    UPDATE public.users u
   SET scan_credits = u.scan_credits + v_pay.scan_credits_granted,
        total_spent_inr = u.total_spent_inr + v_pay.amount_inr,
        total_paid_scans = u.total_paid_scans + v_pay.scan_credits_granted,
        updated_at = NOW()
    WHERE u.id = v_pay.user_id;

    IF NOT FOUND THEN
      -- Roll the payment status back too; never mark paid without crediting.
      RAISE EXCEPTION 'User % not found for order %', v_pay.user_id, p_order_id;
    END IF;

    RETURN QUERY SELECT 'granted'::TEXT, to_jsonb(v_pay);
    RETURN;
  END IF;

  SELECT * INTO v_pay FROM public.payments WHERE razorpay_order_id = p_order_id;

  IF FOUND THEN
    RETURN QUERY SELECT
      CASE WHEN v_pay.status = 'success' THEN 'already_processed' ELSE 'not_payable' END,
      to_jsonb(v_pay);
  ELSE
    RETURN QUERY SELECT 'not_found'::TEXT, NULL::JSONB;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_credits_for_order(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_credits_for_order(TEXT, TEXT, TEXT) TO service_role;

-- ============================================================
-- Rate limiting (generic table + function, reusable by any route)
-- ============================================================
-- Fixed-window counter per (user, action). Uses the same atomic-RPC
-- pattern as consume_scan_credit: the check and the increment happen in
-- one INSERT ... ON CONFLICT statement, so concurrent requests can't
-- both read "under the limit" and both slip through.

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INT NOT NULL DEFAULT 0,
  UNIQUE (user_id, action, window_start)
);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- No client policy: rate_limits is written only by check_rate_limit()
-- (SECURITY DEFINER), so users can't reset their own counters.
DROP POLICY IF EXISTS "rate_limits_all_own" ON rate_limits;
REVOKE ALL ON rate_limits FROM anon, authenticated;

CREATE INDEX IF NOT EXISTS rate_limits_lookup_idx
  ON rate_limits(user_id, action, window_start);

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
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
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Cannot check rate limit for another user';
  END IF;

  v_window_start := to_timestamp(
    floor(extract(epoch FROM NOW()) / p_window_seconds) * p_window_seconds
  );

  INSERT INTO public.rate_limits (user_id, action, window_start, request_count)
  VALUES (p_user_id, p_action, v_window_start, 1)
  ON CONFLICT (user_id, action, window_start)
  DO UPDATE SET request_count = public.rate_limits.request_count + 1
  RETURNING request_count INTO v_count;

  IF v_count > p_max_requests THEN
    RETURN QUERY SELECT
      FALSE,
      GREATEST(
        0,
        p_window_seconds - floor(extract(epoch FROM NOW() - v_window_start))::INT
      );
  ELSE
    RETURN QUERY SELECT TRUE, 0;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(UUID, TEXT, INT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(UUID, TEXT, INT, INT) TO authenticated;

-- Housekeeping (optional): old buckets accumulate harmlessly since they're
-- ============================================================
-- Public (unauthenticated) rate limiting - shared across serverless instances
-- Used by /api/preview-score and /api/public-extract-pdf via lib/ip-rate-limit.ts
-- ============================================================

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
