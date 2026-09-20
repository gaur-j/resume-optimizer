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
function TrackPageViewsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.gtag !== "function") {
      return;
    }

    const query = searchParams.toString();
    const page_path = query ? `${pathname}?${query}` : pathname;

    // Sent as a plain event, not a repeated `config` call, so it flows
    // through whatever was configured at load time - including the
    // Google tag container's fan-out to both GA4 properties - without
    // re-running configuration side effects on every navigation.
    window.gtag("event", "page_view", {
      page_path,
      page_location: window.location.href,
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
