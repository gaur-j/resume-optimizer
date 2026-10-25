-- Database security tests. Run by tests/db/run.sh against a database that has
-- bootstrap.sql, schema.sql and every migration applied. Any failure raises an
-- exception, which stops the run (ON_ERROR_STOP) and fails CI.
--
-- They exist because the protections that matter most here live in SQL (row
-- level security, revoked privileges, atomic payment crediting), where a
-- mistake compiles, deploys and looks fine until someone exploits it.

CREATE SCHEMA IF NOT EXISTS tests;

CREATE OR REPLACE FUNCTION tests.ok(p_condition boolean, p_label text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF p_condition IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'FAIL  %', p_label USING ERRCODE = 'XX001';
  END IF;
  RAISE NOTICE 'PASS  %', p_label;
END $$;

-- Runs p_sql as a client role and requires it to be REFUSED (permission denied
-- or a row-level-security violation). If it succeeds, the test fails.
CREATE OR REPLACE FUNCTION tests.denied(p_role text, p_uid uuid, p_sql text, p_label text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE format('SET LOCAL ROLE %I', p_role);
    PERFORM set_config('request.jwt.claim.sub', COALESCE(p_uid::text, ''), true);
    EXECUTE p_sql;
    RESET ROLE;
    RAISE EXCEPTION 'FAIL  % was ALLOWED', p_label USING ERRCODE = 'XX001';
  EXCEPTION WHEN insufficient_privilege THEN
    RESET ROLE;
    RAISE NOTICE 'PASS  % (refused)', p_label;
  END;
END $$;

-- ── fixtures (as the database owner) ────────────────────────────────────
TRUNCATE auth.users CASCADE;
INSERT INTO auth.users VALUES
  ('11111111-1111-1111-1111-111111111111', 'a@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'b@example.com');
INSERT INTO payments (user_id, razorpay_order_id, amount_inr, scan_credits_granted, status) VALUES
  ('11111111-1111-1111-1111-111111111111', 'order_A', 249, 5, 'pending'),
  ('11111111-1111-1111-1111-111111111111', 'order_B',  99, 1, 'pending'),
  ('22222222-2222-2222-2222-222222222222', 'order_C',  99, 1, 'pending');

-- ── signup ──────────────────────────────────────────────────────────────
SELECT tests.ok((SELECT count(*) = 2 AND bool_and(scan_credits = 3) FROM users),
  'signup trigger creates a users row with exactly 3 free credits');

-- ── clients cannot write money-related state ────────────────────────────
SELECT tests.denied('authenticated', '11111111-1111-1111-1111-111111111111',
  $$UPDATE users SET scan_credits = 999 WHERE id = '11111111-1111-1111-1111-111111111111'$$,
  'user cannot set their own scan_credits');
SELECT tests.denied('authenticated', '11111111-1111-1111-1111-111111111111',
  $$UPDATE users SET total_paid_scans = 999, total_spent_inr = 999$$,
  'user cannot edit paid-scan / spend totals');
SELECT tests.denied('authenticated', '11111111-1111-1111-1111-111111111111',
  $$UPDATE users SET subscription_status = 'active' WHERE id = '11111111-1111-1111-1111-111111111111'$$,
  'user cannot grant themselves a subscription');
SELECT tests.denied('authenticated', '11111111-1111-1111-1111-111111111111',
  $$INSERT INTO payments (user_id, razorpay_order_id, amount_inr, scan_credits_granted, status)
    VALUES ('11111111-1111-1111-1111-111111111111', 'order_FORGED', 1, 1000, 'success')$$,
  'user cannot forge a payment row');
SELECT tests.denied('authenticated', '11111111-1111-1111-1111-111111111111',
  $$UPDATE payments SET status = 'success'$$, 'user cannot mark a payment as paid');
SELECT tests.denied('authenticated', '11111111-1111-1111-1111-111111111111',
  $$DELETE FROM payments$$, 'user cannot delete payments');
SELECT tests.denied('anon', NULL, $$UPDATE users SET scan_credits = 999$$, 'anonymous cannot edit users');

-- ── clients cannot touch rate-limit state ───────────────────────────────
SELECT tests.denied('authenticated', '11111111-1111-1111-1111-111111111111',
  $$DELETE FROM rate_limits$$, 'user cannot reset their own rate-limit counters');
SELECT tests.denied('authenticated', '11111111-1111-1111-1111-111111111111',
  $$SELECT * FROM ip_rate_limits$$, 'user cannot read the IP limiter table');
SELECT tests.denied('anon', NULL,
  $$INSERT INTO ip_rate_limits (key, action, window_start) VALUES ('x', 'y', now())$$,
  'anonymous cannot write the IP limiter table');

-- ── server-only functions are not callable by clients ───────────────────
SELECT tests.denied('authenticated', '11111111-1111-1111-1111-111111111111',
  $$SELECT refund_scan_credit('11111111-1111-1111-1111-111111111111')$$, 'user cannot call refund_scan_credit (credit minting)');
SELECT tests.denied('anon', NULL,
  $$SELECT refund_scan_credit('11111111-1111-1111-1111-111111111111')$$, 'anonymous cannot call refund_scan_credit');
SELECT tests.denied('authenticated', '11111111-1111-1111-1111-111111111111',
  $$SELECT * FROM grant_credits_for_order('order_A')$$, 'user cannot call grant_credits_for_order');
SELECT tests.denied('anon', NULL,
  $$SELECT * FROM check_ip_rate_limit('x', 'y', 5, 60)$$, 'anonymous cannot call check_ip_rate_limit');
SELECT tests.denied('authenticated', '11111111-1111-1111-1111-111111111111',
  $$SELECT * FROM check_ip_rate_limit('x', 'y', 5, 60)$$, 'user cannot call check_ip_rate_limit');
SELECT tests.denied('anon', NULL,
  $$SELECT * FROM check_rate_limit('11111111-1111-1111-1111-111111111111', 'x', 5, 60)$$,
  'anonymous cannot burn another user''s quota');

-- ── row-level security: users only see their own rows ───────────────────
DO $$
DECLARE v_users int; v_payments int;
BEGIN
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
  SELECT count(*) INTO v_users FROM users;
  SELECT count(*) INTO v_payments FROM payments;
  RESET ROLE;
  PERFORM tests.ok(v_users = 1, 'user sees only their own users row');
  PERFORM tests.ok(v_payments = 2, 'user sees only their own payments (2 of 3)');
END $$;

-- ── legitimate paths still work ─────────────────────────────────────────
DO $$
DECLARE own record; other record; v_other int;
BEGIN
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
  SELECT * INTO own FROM consume_scan_credit('11111111-1111-1111-1111-111111111111');
  SELECT * INTO other FROM consume_scan_credit('22222222-2222-2222-2222-222222222222');
  RESET ROLE;  -- the assertion helpers live in a schema clients cannot use
  SELECT scan_credits INTO v_other FROM users WHERE id = '22222222-2222-2222-2222-222222222222';
  PERFORM tests.ok(own.success AND own.remaining_credits = 2, 'user can spend their own credit (3 -> 2)');
  PERFORM tests.ok(NOT other.success, 'user cannot spend someone else''s credit');
  PERFORM tests.ok(v_other = 3, 'the other user''s balance is untouched');
END $$;

DO $$
DECLARE a boolean; b boolean; c boolean; d boolean;
BEGIN
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
  SELECT allowed INTO a FROM check_rate_limit('11111111-1111-1111-1111-111111111111', 'enf', 3, 3600);
  SELECT allowed INTO b FROM check_rate_limit('11111111-1111-1111-1111-111111111111', 'enf', 3, 3600);
  SELECT allowed INTO c FROM check_rate_limit('11111111-1111-1111-1111-111111111111', 'enf', 3, 3600);
  SELECT allowed INTO d FROM check_rate_limit('11111111-1111-1111-1111-111111111111', 'enf', 3, 3600);
  RESET ROLE;
  PERFORM tests.ok(a AND b AND c AND NOT d, 'per-user limiter allows 3 then blocks the 4th');
END $$;

DO $$
BEGIN
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
  BEGIN
    PERFORM * FROM check_rate_limit('22222222-2222-2222-2222-222222222222', 'x', 5, 60);
    RESET ROLE;
    RAISE EXCEPTION 'FAIL  checking another user''s limit was allowed' USING ERRCODE = 'XX001';
  EXCEPTION WHEN raise_exception THEN
    RESET ROLE;
    RAISE NOTICE 'PASS  user cannot touch another user''s rate limit (refused)';
  END;
END $$;

-- ── atomic, idempotent payment crediting (service role) ─────────────────
DO $$
DECLARE r1 record; r2 record; r3 record; r4 record; credits_before int; credits_after int; paid int;
BEGIN
  SELECT scan_credits INTO credits_before FROM users WHERE id = '11111111-1111-1111-1111-111111111111';
  SET LOCAL ROLE service_role;
  SELECT * INTO r1 FROM grant_credits_for_order('order_A', 'pay_1', 'sig_1');
  SELECT * INTO r2 FROM grant_credits_for_order('order_A', 'pay_1', 'sig_1');
  SELECT * INTO r3 FROM grant_credits_for_order('order_A', 'pay_1', 'sig_1');
  SELECT * INTO r4 FROM grant_credits_for_order('order_DOES_NOT_EXIST');
  RESET ROLE;
  SELECT scan_credits, total_paid_scans INTO credits_after, paid FROM users WHERE id = '11111111-1111-1111-1111-111111111111';
  PERFORM tests.ok(r1.outcome = 'granted', 'first grant for an order succeeds');
  PERFORM tests.ok(r2.outcome = 'already_processed' AND r3.outcome = 'already_processed', 'replaying the same payment is a no-op');
  PERFORM tests.ok(r4.outcome = 'not_found', 'unknown order -> not_found');
  PERFORM tests.ok(credits_after = credits_before + 5 AND paid = 5, 'credits increased exactly once (+5), however many times it was replayed');
  PERFORM tests.ok((SELECT status FROM payments WHERE razorpay_order_id = 'order_A') = 'success', 'payment row is marked success');
  PERFORM tests.ok((SELECT razorpay_payment_id FROM payments WHERE razorpay_order_id = 'order_A') = 'pay_1', 'payment id is recorded');
END $$;

DO $$
DECLARE a boolean; b boolean; c boolean;
BEGIN
  SET LOCAL ROLE service_role;
  SELECT allowed INTO a FROM check_ip_rate_limit('ipA', 'act:60', 2, 60);
  SELECT allowed INTO b FROM check_ip_rate_limit('ipA', 'act:60', 2, 60);
  SELECT allowed INTO c FROM check_ip_rate_limit('ipA', 'act:60', 2, 60);
  RESET ROLE;
  PERFORM tests.ok(a AND b AND NOT c, 'IP limiter allows 2 then blocks the 3rd');
  PERFORM tests.ok((SELECT allowed FROM check_ip_rate_limit('ipB', 'act:60', 2, 60)), 'a different IP has its own budget');
END $$;

-- ── subscription_status format ──────────────────────────────────────────
DO $$
BEGIN
  UPDATE users SET subscription_status = 'active' WHERE id = '11111111-1111-1111-1111-111111111111';
  UPDATE users SET subscription_status = NULL WHERE id = '11111111-1111-1111-1111-111111111111';
  BEGIN
    UPDATE users SET subscription_status = 'Active!!' WHERE id = '11111111-1111-1111-1111-111111111111';
    RAISE EXCEPTION 'FAIL  malformed subscription_status was accepted' USING ERRCODE = 'XX001';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASS  malformed subscription_status is rejected by the CHECK constraint';
  END;
END $$;

-- ── structural guards that protect FUTURE tables and functions too ──────
SELECT tests.ok(
  NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
              WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity),
  'every table in public has row-level security enabled (a new table without it fails this)');

SELECT tests.ok(
  NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
              WHERE n.nspname = 'public' AND p.prosecdef
                AND NOT EXISTS (SELECT 1 FROM unnest(COALESCE(p.proconfig, '{}')) c WHERE c LIKE 'search_path=%')),
  'every SECURITY DEFINER function pins its search_path');

SELECT tests.ok(
  NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
             WHERE n.nspname = 'public' AND p.prosecdef
                AND has_function_privilege('anon', p.oid, 'EXECUTE')
                AND p.proname <> 'handle_new_user'),  -- trigger function: cannot be called directly
  'no SECURITY DEFINER function is callable by anonymous clients');

SELECT tests.ok(
  NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
              WHERE n.nspname = 'public' AND p.prosecdef
                AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
                AND p.proname NOT IN ('consume_scan_credit', 'check_rate_limit', 'handle_new_user')),
  'signed-in clients can call only the two intended SECURITY DEFINER functions');
