"use client";

import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAuthModal } from "@/components/auth/AuthModalProvider";

/**
 * Plain-text trigger — used for the "Log in" link in the nav, which is
 * styled as text rather than a full button.
 */
export function NavAuthLink({
  mode,
  className,
  children,
}: {
  mode: "login" | "signup";
  className?: string;
  children: ReactNode;
}) {
  const { open } = useAuthModal();

  return (
    <button
      type="button"
      onClick={() => open(mode)}
      className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md ${
        className ?? ""
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Wraps the shared shadcn Button so every existing CTA (nav, hero,
 * pricing cards, final CTA) can keep its exact variant/size/className
 * while the click handler stays inside the client boundary.
 */
export function AuthCTAButton({
  mode,
  children,
  ...buttonProps
}: { mode: "login" | "signup" } & ComponentProps<typeof Button>) {
  const { open } = useAuthModal();

  return (
    <Button type="button" onClick={() => open(mode)} {...buttonProps}>
      {children}
    </Button>
  );
}
