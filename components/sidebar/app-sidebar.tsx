"use client";

import { PanelLeftClose, PanelLeftOpen, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-provider";
import { navItems } from "./nav-items";
import { NavLink } from "./nav-link";
import { AccountMenu } from "./account-menu";

export function AppSidebar() {
  const { collapsed, toggle } = useSidebar();

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "relative hidden h-screen shrink-0 flex-col bg-card md:flex",
          "border-r border-border/60",
          "transition-[width] duration-300 ease-in-out motion-reduce:transition-none",
          collapsed ? "w-[68px]" : "w-[248px]"
        )}
      >
        {/* Brand */}
        <div
          className={cn(
            "flex h-14 items-center gap-2 px-4",
            collapsed && "justify-center px-0"
          )}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="h-4 w-4" strokeWidth={2.25} />
          </div>
          {!collapsed && (
            <span className="truncate text-sm font-semibold tracking-tight">
              ResumeOptimizer
            </span>
          )}
        </div>

        <Separator className="bg-border/60" />

        {/* Primary nav */}
        <ScrollArea className="flex-1 px-3 py-3">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>
        </ScrollArea>

        <Separator className="bg-border/60" />

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
