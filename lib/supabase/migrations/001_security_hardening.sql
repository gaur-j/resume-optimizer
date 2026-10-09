-- ============================================================
-- 001_security_hardening.sql
-- Run ONCE in the Supabase SQL editor, BEFORE deploying the matching code.
-- Idempotent: safe to re-run.
--
-- Fixes:
--   #1 users_update_own let any user edit their own scan_credits
--   #2 refund_scan_credit was callable by any logged-in user
--   #3/#4 payment crediting is now ONE atomic function (no replay / race)
--   #5 payments_insert_own let clients forge payment rows
--   #6 rate_limits was client-writable (counters could be reset)
-- ============================================================

BEGIN;

-- ── #1 users: clients may READ their own row, never write it ─────────
DROP POLICY IF EXISTS "users_update_own" ON public.users;
REVOKE INSERT, UPDATE, DELETE ON public.users FROM anon, authenticated;

-- consume_scan_credit used to rely on users_update_own. It now runs as
-- SECURITY DEFINER so it keeps working, and still refuses to touch any
-- row other than the caller's (id = auth.uid()).
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

-- ── #2 refund_scan_credit: server-only (service role) ────────────────
-- /api/analyze now calls this through the admin client after a failed
-- pipeline. No client session can call it any more.
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

-- ── #3/#4 atomic, idempotent credit grant ───────────────────────────
-- The pending->success flip and the credit increment happen in ONE
-- transaction. The UPDATE ... WHERE status = 'pending' takes a row lock,
-- so when /api/verify-payment and the webhook race, exactly one wins and
-- the other sees 'already_processed'. Replaying a signature can never
-- grant twice.
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

-- ── #5 payments: read-only for clients ──────────────────────────────
-- /api/create-order now inserts with the service-role client.
DROP POLICY IF EXISTS "payments_insert_own" ON public.payments;
REVOKE INSERT, UPDATE, DELETE ON public.payments FROM anon, authenticated;

-- ── #6 rate_limits: not client-writable ─────────────────────────────
DROP POLICY IF EXISTS "rate_limits_all_own" ON public.rate_limits;
REVOKE ALL ON public.rate_limits FROM anon, authenticated;

-- SECURITY DEFINER so it can write the table clients can no longer touch.
-- IS DISTINCT FROM (not !=) so a NULL auth.uid() (anon) is rejected
-- instead of silently passing the guard.
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

COMMIT;

-- ============================================================
-- OPTIONAL — run separately AFTER the migration to look for past abuse.
-- Both are read-only SELECTs.
-- ============================================================
-- 1) Users whose balances can't be explained by their successful payments
--    (3 = the free signup credits; adjust if you ever gave more):
--
-- SELECT u.id, u.email, u.scan_credits, u.total_paid_scans, u.total_spent_inr
-- FROM public.users u
-- WHERE u.total_spent_inr <> COALESCE((SELECT SUM(amount_inr) FROM public.payments p
--         WHERE p.user_id = u.id AND p.status = 'success'), 0)
--    OR u.total_paid_scans <> COALESCE((SELECT SUM(scan_credits_granted) FROM public.payments p
--         WHERE p.user_id = u.id AND p.status = 'success'), 0)
--    OR u.scan_credits > 3 + u.total_paid_scans;
--
-- 2) 'success' payments with no Razorpay payment id (forged, or granted by
--    the webhook path which doesn't record one) — cross-check each against
--    the Razorpay dashboard:
--
-- SELECT * FROM public.payments
-- WHERE status = 'success' AND razorpay_payment_id IS NULL;
