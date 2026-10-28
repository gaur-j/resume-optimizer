"use client";

import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen, Sparkles, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-provider";
import { navItems } from "./nav-items";
import { NavLink } from "./nav-link";
import { SidebarFooter } from "./sidebar-footer";

type AccountUser = {
  name: string;
  email: string;
  avatarUrl?: string;
};

export function AppSidebar({ user }: { user: AccountUser }) {
  const { collapsed, toggle } = useSidebar();

  return (
    <TooltipProvider delay={0}>
      <aside
        className={cn(
          "relative hidden h-screen shrink-0 flex-col md:flex",
          "bg-gradient-to-b from-card via-card to-muted/30",
          "border-r border-border/60",
          "transition-[width] duration-300 ease-in-out motion-reduce:transition-none",
          collapsed ? "w-[72px]" : "w-[260px]"
        )}
      >
        {/* Brand */}
        <Link
          href="/"
          className={cn("flex h-16 items-center gap-2.5 px-5", collapsed && "justify-center px-0")}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/30 ring-1 ring-primary/40">
            <Sparkles className="h-4 w-4" strokeWidth={2.25} />
          </div>
          {!collapsed && (
            <span className="font-mono text-lg font-semibold tracking-tight text-foreground">
              Resume<span className="text-primary">AI</span>
            </span>
          )}
        </Link>

        {/* Primary action */}
        <div className={cn("px-3 pb-3", collapsed && "px-2")}>
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants(),
              "h-10 w-full gap-2 rounded-xl shadow-sm shadow-primary/20",
              collapsed ? "px-0" : "justify-start px-3"
            )}
          >
            <Plus className="h-4 w-4" />
            {collapsed ? <span className="sr-only">New scan</span> : <span>New scan</span>}
          </Link>
        </div>

        <Separator className="bg-border/60" />

        {/* Primary nav */}
        {/* min-h-0 is required here: a flex-1 child of a flex-col
            container defaults to min-height:auto, which lets it grow to
            fit its content instead of shrinking to the space actually
            available. Without it, a long enough nav list pushes
            SidebarFooter (the account menu) below the rail's visible
            area instead of the list scrolling internally. */}
        <ScrollArea className="min-h-0 flex-1 px-3 py-3">
          {!collapsed && (
            <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
              Workspace
            </p>
          )}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>
        </ScrollArea>

        {/* Upgrade card */}
        {!collapsed && (
          <div className="mx-3 mb-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-semibold text-foreground">Land more interviews</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Run more role-matched scans with a credit pack.
            </p>
            <Link href="/dashboard" className="mt-3 inline-flex text-xs font-semibold text-primary hover:underline">
              Buy credits →
            </Link>
          </div>
        )}

        {/* Account switcher, pinned to the bottom of the rail */}
        <SidebarFooter user={user} />

        {/* Floating collapse/expand toggle */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={toggle}
          className={cn(
            "absolute -right-3 top-[42px] h-6 w-6 rounded-full border-border/70 bg-background shadow-sm",
            "transition-all duration-200 ease-out motion-reduce:transition-none",
            "hover:scale-110 hover:border-primary/50 hover:text-primary"
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-3.5 w-3.5" />
          ) : (
            <PanelLeftClose className="h-3.5 w-3.5" />
          )}
          <span className="sr-only">
            {collapsed ? "Expand sidebar" : "Collapse sidebar"}
          </span>
        </Button>
      </aside>
    </TooltipProvider>
  );
}
