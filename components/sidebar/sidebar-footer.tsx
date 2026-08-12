"use client";

import { useRef } from "react";
import { Separator } from "@/components/ui/separator";
import { AccountMenu } from "./account-menu";

type AccountUser = {
  name: string;
  email: string;
  avatarUrl?: string;
};

/**
 * Pinned to the bottom of the sidebar — desktop rail and mobile drawer
 * alike — matching the account-switcher placement used by Linear, Vercel,
 * and Notion, rather than a separate widget floating in the top header.
 * Owns the real sign-out form; AccountMenu's "Sign Out" item just submits
 * it programmatically, so there's exactly one sign-out implementation
 * shared by both sidebar variants.
 */
export function SidebarFooter({ user }: { user: AccountUser }) {
  const logoutFormRef = useRef<HTMLFormElement>(null);

  return (
    <div className="mt-auto">
      <Separator className="bg-border/60" />
      <div className="p-2">
        <AccountMenu
          user={user}
          onSignOut={() => logoutFormRef.current?.requestSubmit()}
        />
      </div>
      <form
        ref={logoutFormRef}
        action="/auth/logout"
        method="POST"
        className="hidden"
      />
    </div>
  );
}
