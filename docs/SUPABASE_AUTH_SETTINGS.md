# Supabase Auth settings (things code cannot do for you)

These are dashboard settings, not code. The app's code assumes them. Open
**Supabase Dashboard -> Authentication -> Sign In / Providers -> Email**.

## 1. Require current password when changing password - turn ON (security: N1)

**Why:** the "Current password" box in Settings is only a browser check. Anyone
who steals a session token can skip the page and call Supabase's Auth API
directly. With this setting ON, **Supabase's server** refuses any password
change that does not include the correct current password, so a stolen session
can no longer change it. `PasswordSection.tsx` already sends `current_password`.

**Until it is ON, the server ignores that field.**

### Prove it works (use a THROWAWAY test account, never a real one)

If the setting is OFF, the "should fail" call below succeeds and **really changes
the password**. That is why it must be a disposable account.

```bash
URL="https://<project-ref>.supabase.co"; ANON="<anon key>"

# 1. sign in as the test account, copy the access_token from the response
curl -s "$URL/auth/v1/token?grant_type=password" -H "apikey: $ANON" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"OldPassw0rd!"}'

# 2. try to change the password WITHOUT the current one
curl -s -X PUT "$URL/auth/v1/user" -H "apikey: $ANON" \
  -H "Authorization: Bearer <access_token>" -H "Content-Type: application/json" \
  -d '{"password":"NewPassw0rd!x"}'
```

- Setting ON -> step 2 returns an **error** mentioning the current password.
- Setting OFF -> step 2 returns the user object and the password has changed.

Then repeat step 2 with `"current_password":"OldPassw0rd!"` added: it should succeed.

## 2. Secure email change - keep ON (security: N2)

Default is ON. With it, changing an email sends a link to **both** the current
and the new address and only completes after **both** are clicked. A hijacked
session therefore cannot silently move the account to an attacker's inbox.
The Settings page copy tells people to click both links. Just confirm the
toggle was not switched off.

## 3. Password policy

- **Minimum password length: 8 or more.** The Settings form checks 8 in the
  browser, but the server default is lower and the browser check can be skipped.
- Require lowercase, uppercase, digits and symbols if you want stricter rules.
- **Leaked password protection** (HaveIBeenPwned) is available on the Pro plan.

## 4. Optional: Secure password change (re-authentication)

Asks for an emailed code when the session is older than 24 hours. It is safe to
leave OFF: the Settings flow re-signs-in with the current password first, so
the session is always fresh. If you turn it ON the flow keeps working.

## 5. Other things worth checking

- **Authentication -> URL Configuration:** keep the production Site URL and
  remove wildcard / localhost entries from the redirect allow-list in production.
  (The code now only follows same-site redirects, and this is the second lock.)
- **Confirm email: ON**, so nobody can register an address they don't own.
