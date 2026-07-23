"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import LoginPage from "@/app/auth/login/page";
import SignupPage from "@/app/auth/signup/page";

type AuthModalMode = "login" | "signup" | null;

interface AuthModalContextValue {
  open: (mode: "login" | "signup") => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

/**
 * Consumed by AuthTriggerButton / NavAuthLink to open the shared modal
 * from anywhere in the tree without each trigger needing its own state.
 */
export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error("useAuthModal must be used within an AuthModalProvider");
  }
  return ctx;
}

/**
 * Wraps the (server-rendered) landing page. Only this provider and the
 * small trigger components need to be Client Components — everything
 * else on the page can now be static, server-rendered markup.
 */
export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AuthModalMode>(null);

  return (
    <AuthModalContext.Provider value={{ open: setMode }}>
      {children}

      <Dialog
        open={mode !== null}
        onOpenChange={(open) => {
          if (!open) setMode(null);
        }}
      >
        <DialogContent className="max-w-md">
          {mode === "login" && <LoginPage />}
          {mode === "signup" && <SignupPage />}
        </DialogContent>
      </Dialog>
    </AuthModalContext.Provider>
  );
}
