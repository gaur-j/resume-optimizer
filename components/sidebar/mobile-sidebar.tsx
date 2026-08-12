"use client";

import { useState } from "react";
import { Menu, Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider } from "@/components/ui/tooltip";
import { navItems } from "./nav-items";
import { NavLink } from "./nav-link";
import { SidebarProvider } from "./sidebar-provider";
import { SidebarFooter } from "./sidebar-footer";

type AccountUser = {
  name: string;
  email: string;
  avatarUrl?: string;
};

export function MobileSidebar({ user }: { user: AccountUser }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger type="button" className="ghost icon md:hidden">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open menu</span>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-[272px] border-r border-border/60 bg-card p-0"
      >
        {/* forceExpanded: this drawer must never collapse to icon-only,
            regardless of the desktop rail's persisted state — see the
            comment in sidebar-provider.tsx. */}
        <SidebarProvider forceExpanded>
          <TooltipProvider delay={0}>
            <div className="flex h-full flex-col">
              <div className="flex h-14 items-center gap-2 px-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
                  <Sparkles className="h-4 w-4" strokeWidth={2.25} />
                </div>
                <span className="text-xl font-bold text-foreground md:hidden">
                  Resume<span className="text-primary">AI</span>
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

              <SidebarFooter user={user} />
            </div>
          </TooltipProvider>
        </SidebarProvider>
      </SheetContent>
    </Sheet>
  );
}
