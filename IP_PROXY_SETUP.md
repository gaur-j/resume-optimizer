# Shared visitor-IP setup

Existing limits stay unchanged: scoring allows 3 per 10 minutes and 10 per day per visitor IP; PDF extraction allows 10 per 10 minutes. Global daily cost caps remain. People sharing the same real public IP still share a limit.

## Deploy
1. Generate `RESUME_PROXY_SECRET` in the Lovable secure secret form and copy it securely. Never paste it into chat or commit it.
2. Add exactly the same value in Vercel → resume-optimizer → Settings → Environment Variables as `RESUME_PROXY_SECRET`. Enable Production and any Preview environments receiving forwarded requests. Never prefix with `NEXT_PUBLIC_` or `VITE_`.
3. Deploy this repository revision to Vercel and the updated Lovable app. Environment changes require a fresh deployment.
4. Check a PDF and score through Lovable. Verify two different public visitor IPs consume separate hashed database keys, not the forwarding server's key. Keep the intentional global cost cap.

## Files
- `app/globals.css`: shared blue light/dark tokens, opt-in motion, skeleton, gradient and shadow utilities. Preserves Tailwind/shadcn imports, sidebar tokens, IBM Plex font variables and reduced-motion protection.
- `lib/trusted-proxy-ip.ts`: verifies signed IP + timestamp + method + path; expires after 60 seconds.
- `lib/ip-rate-limit.ts`: hashes and counts verified visitor addresses.
- `tests/unit/trusted-proxy-ip.test.ts`: included by `npm run test:unit`.
- No edits needed to `app/layout.tsx` or the two free route handlers: CSS is already imported and both handlers await the limiter.

## Spoofing and shared counters
Callers can send a plain custom IP header or prepend the first `x-forwarded-for` entry. Trusting either lets them invent addresses to bypass free limits. Only a server with the shared secret can sign accepted handoffs. Invalid, unsigned custom, expired and cross-route handoffs are refused before scoring. Direct visitors still use Vercel's edge-provided rightmost address; revisit that fallback if another reverse proxy is placed before Vercel.

Previously all forwarded visitors consumed the forwarding server's 10/day allowance. Verified visitor addresses now use individual IP counters. Global caps remain deliberately shared. The timestamp limits replay time; signatures are not single-use authentication, and repeated valid requests still consume the same IP allowance.
