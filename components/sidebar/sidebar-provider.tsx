"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type SidebarContextValue = {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (value: boolean) => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

const STORAGE_KEY = "ro-sidebar-collapsed";

/**
 * @param forceExpanded - When true, never reads or writes the persisted
 * collapse state, always stays expanded, and disables the Cmd/Ctrl+B
 * shortcut. Used by the mobile drawer (MobileSidebar), which would
 * otherwise silently inherit the desktop rail's collapsed state from
 * the same localStorage key — icon-only collapsed mode doesn't make
 * sense once the sidebar is already a drawer the user just opened.
 */
export function SidebarProvider({
  children,
  forceExpanded = false,
}: {
  children: ReactNode;
  forceExpanded?: boolean;
}) {
  // Default to expanded on first paint; sync from localStorage after mount
  // to avoid a hydration mismatch between server and client.
  const [collapsed, setCollapsedState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (forceExpanded) {
      setHydrated(true);
      return;
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored !== null) setCollapsedState(stored === "1");
    } catch {
      // localStorage unavailable (e.g. privacy mode) — fall back to expanded
    }
    setHydrated(true);
  }, [forceExpanded]);

  const setCollapsed = useCallback(
    (value: boolean) => {
      if (forceExpanded) return;
      setCollapsedState(value);
      try {
        window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
      } catch {
        // ignore write failures
      }
    },
    [forceExpanded]
  );

  const toggle = useCallback(() => {
    if (forceExpanded) return;
    setCollapsedState((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore write failures
      }
      return next;
    });
  }, [forceExpanded]);

  // Cmd/Ctrl + B toggles the sidebar, matching the convention used by
  // most modern editors and SaaS dashboards. Disabled for forced-expanded
  // instances (e.g. the mobile drawer) since there's no collapse UI there.
  useEffect(() => {
    if (forceExpanded) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [forceExpanded, toggle]);

  return (
    <SidebarContext.Provider
      value={{
        collapsed: forceExpanded ? false : hydrated ? collapsed : false,
        toggle,
        setCollapsed,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within a <SidebarProvider>");
  }
  return ctx;
}
