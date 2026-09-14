"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type SidebarContextValue = {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (value: boolean) => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

const STORAGE_KEY = "ro-sidebar-collapsed";
const SIDEBAR_CHANGE_EVENT = "ro-sidebar-change";

function subscribeSidebar(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(SIDEBAR_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SIDEBAR_CHANGE_EVENT, callback);
  };
}

function getSidebarSnapshot(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function getSidebarServerSnapshot(): boolean {
  return false;
}

function persistSidebarState(value: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");

    // The browser's "storage" event does not fire in the same tab.
    window.dispatchEvent(new Event(SIDEBAR_CHANGE_EVENT));
  } catch {
    // localStorage unavailable — UI state still works for this interaction
  }
}

export function SidebarProvider({
  children,
  forceExpanded = false,
}: {
  children: ReactNode;
  forceExpanded?: boolean;
}) {
  const persistedCollapsed = useSyncExternalStore(
    subscribeSidebar,
    getSidebarSnapshot,
    getSidebarServerSnapshot
  );

  const collapsed = forceExpanded ? false : persistedCollapsed;

  const setCollapsed = useCallback(
    (value: boolean) => {
      if (forceExpanded) return;
      persistSidebarState(value);
    },
    [forceExpanded]
  );

  const toggle = useCallback(() => {
    if (forceExpanded) return;
    persistSidebarState(!persistedCollapsed);
  }, [forceExpanded, persistedCollapsed]);

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
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
