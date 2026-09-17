"use client";

const STORAGE_KEY = "first_touch_attribution";

export interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  landing_page?: string;
  first_touch_at?: string;
}

export function captureAttribution() {
  if (typeof window === "undefined") return;

  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    const params = new URLSearchParams(window.location.search);
    const hasUTM =
      params.has("utm_source") ||
      params.has("utm_medium") ||
      params.has("utm_campaign");

    if (existing && !hasUTM) return; // keep first-touch attribution

    if (hasUTM) {
      const attribution: Attribution = {
        utm_source: params.get("utm_source") ?? undefined,
        utm_medium: params.get("utm_medium") ?? undefined,
        utm_campaign: params.get("utm_campaign") ?? undefined,
        landing_page: window.location.pathname,
        first_touch_at: new Date().toISOString(),
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
    }
  } catch {
    // localStorage can throw in private browsing — never block the app on it.
  }
}

export function getAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Attribution) : {};
  } catch {
    return {};
  }
}
