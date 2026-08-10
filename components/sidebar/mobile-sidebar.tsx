"use client";

import { useState } from "react";
import { Menu, Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider } from "@/components/ui/tooltip";
import { navItems } from "./nav-items";
import { NavLink } from "./nav-link";
import { AccountMenu } from "./account-menu";
import { SidebarProvider } from "./sidebar-provider";

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-[272px] border-r border-border/60 bg-card p-0"
      >
        {/*
          Nested provider forces an expanded, icon+label layout inside the
          drawer regardless of the desktop sidebar's collapsed state —
          collapsed/icon-only mode doesn't make sense once it's a drawer.
        */}
        <SidebarProvider>
          <TooltipProvider delayDuration={0}>
            <div className="flex h-full flex-col">
              <div className="flex h-14 items-center gap-2 px-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
                  <Sparkles className="h-4 w-4" strokeWidth={2.25} />
                </div>
                <span className="truncate text-sm font-semibold tracking-tight">
                  ResumeOptimizer
                </span>
              </div>

              <Separator className="bg-border/60" />

              <ScrollArea className="flex-1 px-3 py-3">
                <nav
                  className="flex flex-col gap-1"
                  onClick={() => setOpen(false)}
                >
                  {navItems.map((item) => (
                    <NavLink key={item.href} item={item} />
                  ))}
                </nav>
              </ScrollArea>

              <Separator className="bg-border/60" />

              <div className="p-3">
                <AccountMenu />
              </div>
            </div>
          </TooltipProvider>
        </SidebarProvider>
      </SheetContent>
    </Sheet>
  );
}
