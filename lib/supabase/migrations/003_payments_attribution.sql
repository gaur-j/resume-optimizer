-- ============================================================
-- 003_payments_attribution.sql
-- /api/create-order has always written payments.attribution, but the column
-- was never in schema.sql, so a database built from schema.sql alone would
-- fail every order insert. Idempotent: a no-op if your DB already has it.
-- ============================================================
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS attribution JSONB;
