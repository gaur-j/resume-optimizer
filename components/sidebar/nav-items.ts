import { LayoutDashboard, type LucideIcon } from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

// Only list routes that actually exist as real pages. As new dashboard
// pages ship (scan history, account settings, etc.), add them here —
// this is the only file you need to touch to extend the nav.
export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];
