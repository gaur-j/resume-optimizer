"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { AccountMenu } from "@/components/sidebar/account-menu";

interface DashboardHeaderActionsProps {
  user: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

export function DashboardHeaderActions({ user }: DashboardHeaderActionsProps) {
  const logoutFormRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <AccountMenu
        user={user}
        onSignOut={() => logoutFormRef.current?.requestSubmit()}
      />

      {/* This is your real, working sign-out — unchanged from before.
          AccountMenu's "Sign Out" item above just submits this same form
          programmatically, so there's exactly one sign-out implementation,
          not two. */}
      <form ref={logoutFormRef} action="/auth/logout" method="POST">
        <Button variant="outline" size="sm" type="submit">
          Logout
        </Button>
      </form>
    </>
  );
}
