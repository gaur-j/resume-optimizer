"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LogOut } from "lucide-react";
import { useSidebar } from "./sidebar-provider";
import { AccountMenu } from "./account-menu";

type AccountUser = {
  name: string;
  email: string;
  avatarUrl?: string;
};

/**
 * Pinned to the bottom of the sidebar — desktop rail and mobile drawer
 * alike. Renders the account menu (which includes a "Sign Out" item)
 * plus a direct, always-visible sign-out icon-button for a one-click
 * path that doesn't require opening the dropdown first. Both paths call
 * the SAME signOut() function, so there's exactly one sign-out
 * implementation, just two entry points to it.
 *
 * signOut() calls POST /auth/logout via fetch rather than submitting a
 * native <form> - a real form submission is a hard, full-document
 * navigation, which is what was producing an unexpected full-page reload
 * (and, on some browsers, a "confirm form resubmission" prompt on the
 * back button) every time someone signed out. fetch() still hits the
 * exact same route handler and gets the same Set-Cookie clearing the
 * session; only the navigation afterward is a normal Next.js transition.
 */
export function SidebarFooter({ user }: { user: AccountUser }) {
  const { collapsed } = useSidebar();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const res = await fetch("/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error(`Sign out failed (${res.status})`);
      router.push("/");
      router.refresh();
    } catch {
      toast.error(
        "Couldn't sign out. Please check your connection and try again."
      );
      setSigningOut(false);
    }
  }

  return (
    <div className="mt-auto">
      <Separator className="bg-border/60" />
      <div className="flex items-center gap-1 p-2">
        <div className="min-w-0 flex-1">
          <AccountMenu user={user} onSignOut={signOut} />
        </div>

        {/* Hidden in the collapsed icon-rail — no room for two separate
            controls there. The account menu's own tooltip + Sign Out
            item still covers sign-out in that state. */}
        {!collapsed && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={signOut}
                  disabled={signingOut}
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Sign out</span>
                </Button>
              }
            />
            <TooltipContent side="top" sideOffset={8}>
              Sign out
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
