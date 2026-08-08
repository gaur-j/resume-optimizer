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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "scans_select_own" ON scans;
CREATE POLICY "scans_select_own" ON scans
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "scans_insert_own" ON scans;
CREATE POLICY "scans_insert_own" ON scans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "payments_select_own" ON payments;
CREATE POLICY "payments_select_own" ON payments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "payments_insert_own" ON payments;
CREATE POLICY "payments_insert_own" ON payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "referrals_select_own" ON referrals;
CREATE POLICY "referrals_select_own" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Note: UPDATEs to payments.status and users.scan_credits are done
-- server-side via the service-role client (lib/supabase/admin.ts),
-- which bypasses RLS by design — that's why there's no "update own"
-- policy for payments or a credits-update policy for users beyond
-- what's above. Never expose the service-role key to the browser.

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
-- Consuming and refunding scan_credits must never be a read-then-write
-- from application code — two concurrent requests could both read the
-- same balance and both proceed. These functions perform the guard and
-- the update in a single UPDATE statement, which Postgres serializes at
-- the row level, so only one concurrent caller can ever succeed once
-- credits are down to their last unit.
--
-- These run under the CALLER's own session (not the service-role admin
-- client), relying on the existing "users_update_own" RLS policy above —
-- that's why each function also pins p_user_id = auth.uid() as a second,
-- explicit guard. This is intentionally different from the payment-
-- crediting path in lib/payments.ts, which legitimately needs the
-- service-role client because it runs from a webhook with no user session.

CREATE OR REPLACE FUNCTION public.consume_scan_credit(p_user_id UUID)
RETURNS TABLE (success BOOLEAN, remaining_credits INT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_remaining INT;
BEGIN
  UPDATE users
  SET scan_credits = scan_credits - 1,
      updated_at = NOW()
  WHERE id = p_user_id
    AND id = auth.uid()      -- never let a caller spend someone else's credit
    AND scan_credits > 0
  RETURNING scan_credits INTO v_remaining;

  IF v_remaining IS NULL THEN
    RETURN QUERY
      SELECT FALSE, COALESCE((SELECT scan_credits FROM users WHERE id = p_user_id), 0);
  ELSE
    RETURN QUERY SELECT TRUE, v_remaining;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_scan_credit(UUID) TO authenticated;

-- Refunds one credit — used when a scan is consumed atomically up front
-- but the AI pipeline or DB write fails afterward, so the user isn't
-- charged for a scan they never actually received.
CREATE OR REPLACE FUNCTION public.refund_scan_credit(p_user_id UUID)
RETURNS INT
LANGUAGE sql
AS $$
  UPDATE users
  SET scan_credits = scan_credits + 1,
      updated_at = NOW()
  WHERE id = p_user_id
    AND id = auth.uid()
  RETURNING scan_credits;
$$;

GRANT EXECUTE ON FUNCTION public.refund_scan_credit(UUID) TO authenticated;

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

DROP POLICY IF EXISTS "rate_limits_all_own" ON rate_limits;
CREATE POLICY "rate_limits_all_own" ON rate_limits
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS rate_limits_lookup_idx
  ON rate_limits(user_id, action, window_start);

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_action TEXT,
  p_max_requests INT,
  p_window_seconds INT
) RETURNS TABLE (allowed BOOLEAN, retry_after_seconds INT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_count INT;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot check rate limit for another user';
  END IF;

  -- Bucket "now" into fixed windows of p_window_seconds — e.g. with a
  -- 60s window, 14:32:07 and 14:32:53 land in the same bucket (14:32:00).
  v_window_start := to_timestamp(
    floor(extract(epoch FROM NOW()) / p_window_seconds) * p_window_seconds
  );

  INSERT INTO rate_limits (user_id, action, window_start, request_count)
  VALUES (p_user_id, p_action, v_window_start, 1)
  ON CONFLICT (user_id, action, window_start)
  DO UPDATE SET request_count = rate_limits.request_count + 1
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

GRANT EXECUTE ON FUNCTION public.check_rate_limit(UUID, TEXT, INT, INT) TO authenticated;

-- Housekeeping (optional): old buckets accumulate harmlessly since they're
-- tiny rows, but you can prune them periodically, e.g. via a daily cron:
--   DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '2 days';