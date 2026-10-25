-- ============================================================
-- 004_followups.sql
-- Run once in the Supabase SQL editor. Idempotent: safe to re-run.
--
--  #18  handle_new_user is SECURITY DEFINER (it runs with its owner's rights),
--       so it must pin its own search_path. Without that, a function or
--       operator of the same name placed earlier in the caller's search_path
--       could be run with those elevated rights.
--  N4   users.subscription_status: the app already reads it to unlock paid
--       templates (lib/plan.ts) but the column was never in the schema.
--       Only the service role may write it (clients have no UPDATE on users
--       since migration 001), which is what keeps users from granting
--       themselves a subscription.
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, scan_credits)
  VALUES (NEW.id, NEW.email, 3)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_status TEXT;

-- Only the format is constrained (lowercase words, e.g. 'active'), not a fixed
-- list, so adding a new billing state later never needs a schema change.
-- NOT VALID = enforced for new writes without failing on any value already in
-- the table; run the VALIDATE statement below once you have checked them.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_subscription_status_format'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_subscription_status_format
      CHECK (subscription_status IS NULL OR subscription_status ~ '^[a-z_]{1,32}$')
      NOT VALID;
  END IF;
END
$$;

COMMIT;

-- Optional, after reviewing:  SELECT subscription_status, count(*) FROM public.users GROUP BY 1;
-- then:  ALTER TABLE public.users VALIDATE CONSTRAINT users_subscription_status_format;