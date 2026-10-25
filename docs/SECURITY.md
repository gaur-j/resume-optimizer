# Security notes

How the app is protected, where each protection lives, and how to check it.

## The model in one paragraph

The browser is untrusted. Credits, payments and rate limits are written **only
by server code or by database functions**, never directly by a signed-in user.
Every route validates its input (size, shape, type) before doing anything that
costs money, and AI output is validated before it is stored or shown.

## Where each protection lives

| Protection                                                                  | Where                                                                         |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Users cannot edit credits, payments, subscription status or rate-limit rows | row-level security + revoked privileges: `lib/supabase/migrations/001`, `004` |
| Payment crediting is atomic and replay-proof                                | `grant_credits_for_order()` in `001`; used by `lib/payments.ts`               |
| Public endpoints are rate-limited across all servers                        | `lib/ip-rate-limit.ts` + `002` (counters live in Postgres)                    |
| Request bodies are size-capped while streaming                              | `lib/request-body.ts`, limits in `lib/limits.ts`                              |
| PDF uploads: type, size, page, text and time limits                         | `lib/pdf-upload.ts`, `lib/pdf.ts`                                             |
| AI output is validated; user text is fenced as untrusted                    | `lib/ai-validate.ts`, `lib/ai.ts`                                             |
| Redirects stay on-site; signatures compared in constant time                | `lib/security.ts`                                                             |
| Export input is validated and rate-limited                                  | `lib/export-validate.ts`, `/api/export`                                       |
| Security headers                                                            | `next.config.ts` (see CSP below)                                              |
| Password / email change hardening                                           | Supabase dashboard: `docs/SUPABASE_AUTH_SETTINGS.md`                          |

## Checking it

```bash
npm run check      # lint + type-check + unit/route tests
npm run test:db    # database security tests (see below)
```

npm test` runs on **Node 20 or newer** and works in any terminal. If you use
VS Code's "JavaScript Debug Terminal", the runner strips the injected debugger
hooks itself, so you will not see "Debugger attached" noise.

### Database tests (`npm run test:db`)

These build a throwaway database from `schema.sql` plus every numbered
migration and try to break it: forging payments, minting credits, replaying a
payment 25 times at once. **CI runs them on every push, so you do not have to
run them locally.**

If you do want to, they need their _own_ disposable PostgreSQL. The password
prompt you may see is for that local server, **never** for Supabase:

```bash
docker run --rm -d --name rls-pg -e POSTGRES_PASSWORD=test -p 54329:5432 postgres:16
PGHOST=localhost PGPORT=54329 PGUSER=postgres PGPASSWORD=test npm run test:db
docker stop rls-pg
```

The runner refuses to start against any host containing "supabase", refuses
non-local hosts unless `ALLOW_REMOTE_TEST_DB=yes`, never prompts for a password,
and deletes its temporary `rls_test_*` database when it finishes. It needs
`bash` (Git Bash on Windows) and the `psql` client.

### Against your real Supabase project

Paste `lib/supabase/migrations/verify_live_db.sql` into the SQL editor.
Every row should read `true`. It is read-only.

## Content-Security-Policy rollout

The rules that cannot affect how the app loads (`object-src`, `base-uri`,
`frame-ancestors`, `form-action`) are always enforced. The script / connect /
frame rules run in **Report-Only** mode because a missing origin would break
Razorpay checkout or analytics, and that cannot be tested without a browser.

1. Deploy, open the site with DevTools -> Console.
2. Visit the landing page, log in, open the dashboard, and make a Razorpay
   **test** payment.
3. Look for `[Report Only] Refused to ...` lines. None = safe to enforce.
4. Set `CSP_ENFORCE=true` in Vercel and redeploy. Remove it to roll back.

`'unsafe-inline'` remains in `script-src` because Next.js emits inline
scripts; removing it needs per-request nonces, a larger change.

## Error alerts

Set `ERROR_WEBHOOK_URL` (a Slack or Discord incoming webhook, https only) and
failures that need a human are posted there: a payment taken but not credited,
the AI provider failing, PDF export failing. Unset = disabled. Only an error
message and a short scope name are sent, never resume text or emails. See
`lib/monitoring.ts`. It is a stop-gap; Sentry is the usual next step.

## Known limits (deliberate, not forgotten)

- `user_metadata` (name, avatar) is user-writable through Supabase and has no
  server-side size cap. The app limits what it writes and sanitises what it
  renders, but cannot stop a direct API call from storing a huge value.
- The webhook returns 200 even when crediting fails (so Razorpay does not retry
  forever); the failure is logged and, if configured, alerted.
- Prompt injection can be reduced, not eliminated; that is why model output is
  validated and nothing it says is executed.
