"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "./sidebar-provider";
import type { NavItem } from "./nav-items";

export function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const active =
    pathname === item.href || pathname?.startsWith(`${item.href}/`);
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
        "transition-colors duration-200 ease-out motion-reduce:transition-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active
          ? "bg-primary/10 text-primary dark:bg-primary/15"
          : "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
        collapsed && "justify-center px-0"
      )}
    >
      {/* Active-state rail, animates in/out rather than a filled pill */}
      <span
        className={cn(
          "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary",
          "transition-all duration-200 ease-out motion-reduce:transition-none",
          active ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0"
        )}
      />

      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none",
          "group-hover:scale-[1.08]",
          active
            ? "text-primary"
            : "text-muted-foreground group-hover:text-foreground"
        )}
        strokeWidth={2}
      />

      {!collapsed && <span className="flex-1 truncate">{item.title}</span>}

      {!collapsed && item.badge && (
        <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary">
          {item.badge}
        </span>
      )}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger>{link}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={12} className="font-medium">
        {item.title}
        {item.badge && (
          <span className="ml-1.5 text-primary">· {item.badge}</span>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
