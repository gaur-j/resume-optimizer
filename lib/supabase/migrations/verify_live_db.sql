-- ============================================================
-- verify_live_db.sql  -  READ-ONLY. Paste into the Supabase SQL editor.
-- Every row should show ok = true. Any false = that migration is
-- missing (or was only partly applied) on this database.
-- ============================================================
SELECT check_name, ok FROM (VALUES
  -- 001: clients can no longer write credits / payments / counters
  ('001 authenticated cannot UPDATE users',
     NOT has_table_privilege('authenticated','public.users','UPDATE')),
  ('001 authenticated cannot INSERT payments',
     NOT has_table_privilege('authenticated','public.payments','INSERT')),
  ('001 authenticated cannot write rate_limits',
     NOT has_table_privilege('authenticated','public.rate_limits','DELETE')),
  ('001 no users_update_own policy',
     NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND policyname='users_update_own')),
  ('001 no payments_insert_own policy',
     NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND policyname='payments_insert_own')),
  ('001 no rate_limits_all_own policy',
     NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND policyname='rate_limits_all_own')),
  ('001 authenticated cannot call refund_scan_credit',
     COALESCE(NOT has_function_privilege('authenticated', to_regprocedure('public.refund_scan_credit(uuid)'), 'EXECUTE'), false)),
  ('001 anon cannot call refund_scan_credit',
     COALESCE(NOT has_function_privilege('anon', to_regprocedure('public.refund_scan_credit(uuid)'), 'EXECUTE'), false)),
  ('001 grant_credits_for_order exists',
     to_regprocedure('public.grant_credits_for_order(text,text,text)') IS NOT NULL),
  ('001 authenticated cannot call grant_credits_for_order',
     COALESCE(NOT has_function_privilege('authenticated', to_regprocedure('public.grant_credits_for_order(text,text,text)'), 'EXECUTE'), false)),
  ('001 consume_scan_credit is SECURITY DEFINER',
     COALESCE((SELECT prosecdef FROM pg_proc WHERE oid = to_regprocedure('public.consume_scan_credit(uuid)')), false)),
  ('001 check_rate_limit is SECURITY DEFINER',
     COALESCE((SELECT prosecdef FROM pg_proc WHERE oid = to_regprocedure('public.check_rate_limit(uuid,text,int,int)')), false)),
  -- 002: shared public limiter
  ('002 check_ip_rate_limit exists',
     to_regprocedure('public.check_ip_rate_limit(text,text,int,int)') IS NOT NULL),
  ('002 anon cannot call check_ip_rate_limit',
     COALESCE(NOT has_function_privilege('anon', to_regprocedure('public.check_ip_rate_limit(text,text,int,int)'), 'EXECUTE'), false)),
  ('002 authenticated cannot touch ip_rate_limits',
     COALESCE(NOT has_table_privilege('authenticated', to_regclass('public.ip_rate_limits'), 'SELECT'), false)),
  -- 003: order inserts write payments.attribution
  ('003 payments.attribution column exists',
     EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'attribution')),
  -- 004: subscription column + every SECURITY DEFINER function pins its search_path
  ('004 users.subscription_status column exists',
     EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'subscription_status')),
  ('004 authenticated cannot write users.subscription_status',
     COALESCE(NOT has_column_privilege('authenticated', 'public.users', 'subscription_status', 'UPDATE'), false)),
  ('004 every SECURITY DEFINER function pins search_path',
     NOT EXISTS (
       SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
       WHERE n.nspname = 'public' AND p.prosecdef
         AND NOT EXISTS (SELECT 1 FROM unnest(COALESCE(p.proconfig, '{}')) c WHERE c LIKE 'search_path=%')))
) AS t(check_name, ok);

-- Past-abuse review (rows here deserve a look; zero rows is the good answer):
SELECT id, email, scan_credits, total_paid_scans, total_spent_inr
FROM public.users u
WHERE u.total_spent_inr <> COALESCE((SELECT SUM(amount_inr) FROM public.payments p WHERE p.user_id = u.id AND p.status = 'success'), 0)
   OR u.total_paid_scans <> COALESCE((SELECT SUM(scan_credits_granted) FROM public.payments p WHERE p.user_id = u.id AND p.status = 'success'), 0)
   OR u.scan_credits > 3 + u.total_paid_scans;

-- If you added a subscription_status column by hand, who has it set?
-- (Before migration 001 any user could have set this to 'active' themselves.)
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users' AND column_name LIKE 'subscription%';