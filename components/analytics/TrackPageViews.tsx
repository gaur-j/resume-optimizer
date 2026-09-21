"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Fires a manual GA4 page_view on every client-side route change.
 *
 * Next.js App Router navigates via the History API (pushState) without a
 * full page reload, and gtag.js's automatic page_view detection does not
 * reliably pick these up (a well-documented gap - see
 * https://github.com/vercel/next.js/issues/58924, not specific to this
 * app). Without this component, GA4 only ever records the very first
 * page a visitor lands on - exactly what showed up as a single "/" row
 * in Realtime after navigating elsewhere in the app.
 *
 * The automatic page_view is disabled via `send_page_view: false` in the
 * root gtag config (see app/layout.tsx), so this component is the ONLY
 * source of page_view events - including for the first page load - which
 * avoids double-counting the landing page.
 */
// Query params that can carry a one-time auth token, session code, or
// other secret - e.g. the `code` on a PKCE OAuth/password-recovery
// redirect, or a `token_hash` on an email verification link. These should
// never leave the browser in an analytics payload, even transiently while
// a page like /auth/callback is loading. Defense in depth: the reset-
// password flow no longer exposes `code` in its URL at all (it's
// exchanged server-side in /auth/callback before the browser ever lands
// on a page that loads this component), but this redacts the param by
// name regardless of which page it shows up on.
const SENSITIVE_PARAMS = [
  "code",
  "token",
  "token_hash",
  "access_token",
  "refresh_token",
];

/** Redacts any sensitive param values in-place and returns the same URL. */
function redactSensitiveParams(url: URL): URL {
  for (const param of SENSITIVE_PARAMS) {
    if (url.searchParams.has(param)) {
      url.searchParams.set(param, "redacted");
    }
  }
  return url;
}

function TrackPageViewsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.gtag !== "function") {
      return;
    }

    const url = redactSensitiveParams(new URL(window.location.href));
    const query = url.searchParams.toString();
    const page_path = query ? `${pathname}?${query}` : pathname;

    // Sent as a plain event, not a repeated `config` call, so it flows
    // through whatever was configured at load time - including the
    // Google tag container's fan-out to both GA4 properties - without
    // re-running configuration side effects on every navigation.
    window.gtag("event", "page_view", {
      page_path,
      page_location: url.toString(),
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}

/**
 * useSearchParams() requires a Suspense boundary in the App Router, or
 * Next.js fails the build - see
 * https://nextjs.org/docs/messages/deopted-into-client-rendering
 */
export function TrackPageViews() {
  return (
    <Suspense fallback={null}>
      <TrackPageViewsInner />
    </Suspense>
  );
}
