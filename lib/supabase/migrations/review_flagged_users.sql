-- ============================================================
-- review_flagged_users.sql  -  READ-ONLY (except the clearly marked,
-- commented-out section 4). Run each numbered section on its own in the
-- Supabase SQL editor.
--
-- Purpose: decide, with evidence, whether the accounts flagged by
-- verify_live_db.sql were edited by hand (e.g. you testing) or exploited
-- the old "users can UPDATE their own row" hole (fixed by migration 001).
--
-- Ledger rule used below: every account starts with 3 free credits, +N for
-- each successful payment, -1 for each scan stored. So:
--     expected credits = 3 + credits bought - scans used
-- (A failed scan is refunded, so it nets out to zero.) "unexplained" credits
-- are the difference between that and what the account actually holds.
-- ============================================================

-- 1) Ledger check for EVERY account (not just the flagged ones).
--    Look at unexplained_credits, and at paid_inr vs spent_inr.
SELECT
  u.email,
  u.created_at                                      AS signed_up,
  u.updated_at                                      AS row_last_changed,
  u.scan_credits                                    AS credits_now,
  3 + COALESCE(p.credits_bought, 0) - COALESCE(s.scans_used, 0) AS credits_expected,
  u.scan_credits - (3 + COALESCE(p.credits_bought, 0) - COALESCE(s.scans_used, 0)) AS unexplained_credits,
  u.total_paid_scans                                AS paid_scans_recorded,
  COALESCE(p.credits_bought, 0)                     AS paid_scans_in_payments,
  u.total_spent_inr                                 AS spent_inr_recorded,
  COALESCE(p.paid_inr, 0)                           AS paid_inr_in_payments,
  COALESCE(s.scans_used, 0)                         AS scans_used,
  COALESCE(p.pending, 0)                            AS pending_payments
FROM public.users u
LEFT JOIN (
  SELECT user_id,
         SUM(scan_credits_granted) FILTER (WHERE status = 'success') AS credits_bought,
         SUM(amount_inr)           FILTER (WHERE status = 'success') AS paid_inr,
         COUNT(*)                  FILTER (WHERE status = 'pending') AS pending
  FROM public.payments GROUP BY user_id
) p ON p.user_id = u.id
LEFT JOIN (
  SELECT user_id, COUNT(*) AS scans_used FROM public.scans GROUP BY user_id
) s ON s.user_id = u.id
ORDER BY unexplained_credits DESC, u.created_at;

-- 2) Every payment row for the flagged accounts. A real payment has a
--    razorpay_payment_id; compare amounts with what you see in the Razorpay dashboard.
SELECT u.email, p.razorpay_order_id, p.razorpay_payment_id, p.amount_inr,
       p.scan_credits_granted, p.status, p.created_at
FROM public.payments p JOIN public.users u ON u.id = p.user_id
WHERE u.id IN ('7a0c509c-f41c-492f-8360-35faf87cc5b8',
               '898d77a6-f218-4958-89d5-0d1b24241aa6',
               '3cf1d555-2d20-4a49-870e-f36790a8fd3e')
ORDER BY u.email, p.created_at;

-- 3) The decisive evidence: Supabase API request logs.
--    Dashboard -> Logs -> Logs Explorer (API Gateway / edge_logs). Paste:
--
--    select cast(t.timestamp as datetime) as ts, request.method, request.path,
--           response.status_code
--    from edge_logs as t
--      cross join unnest(t.metadata) as m
--      cross join unnest(m.request) as request
--      cross join unnest(m.response) as response
--    where (request.method = 'PATCH' and request.path like '%/rest/v1/users%')
--       or (request.path like '%/rpc/refund_scan_credit%')
--       or (request.method = 'POST' and request.path like '%/rest/v1/payments%')
--    order by t.timestamp desc
--    limit 100
--
--    A PATCH on /rest/v1/users (or a call to refund_scan_credit) from the app's
--    anon/authenticated key = someone used the hole. Nothing found = either
--    manual edits in the dashboard (which don't appear as API requests) or the
--    logs have expired: retention is short (about 1 day on Free, 7 on Pro).

-- 4) ONLY after you have decided an account was NOT a legitimate edit:
--    rebuild its balances from the ledger. Uncomment, put the ids you
--    confirmed in the IN (...) list, and run. This DISCARDS any credits that
--    were not bought or earned (e.g. credits you granted by hand on purpose),
--    so do not run it on accounts you edited intentionally.
--
-- UPDATE public.users u
-- SET scan_credits     = GREATEST(0, 3 + agg.credits_bought - agg.scans_used),
--     total_paid_scans = agg.credits_bought,
--     total_spent_inr  = agg.paid_inr,
--     updated_at       = NOW()
-- FROM (
--   SELECT u2.id,
--     COALESCE((SELECT SUM(scan_credits_granted) FROM public.payments
--               WHERE user_id = u2.id AND status = 'success'), 0) AS credits_bought,
--     COALESCE((SELECT SUM(amount_inr) FROM public.payments
--               WHERE user_id = u2.id AND status = 'success'), 0) AS paid_inr,
--     (SELECT COUNT(*) FROM public.scans WHERE user_id = u2.id)   AS scans_used
--   FROM public.users u2
-- ) AS agg
-- WHERE u.id = agg.id
--   AND u.id IN ('<paste confirmed user ids here>');