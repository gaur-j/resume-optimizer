import {
  LayoutDashboard,
  FileText,
  Sparkles,
  Target,
  LayoutTemplate,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

// Swap these for your real routes — this is the only file you should
// need to touch to add, remove, or reorder primary nav items.
export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "My Resumes", href: "/resumes", icon: FileText },
  { title: "Optimize", href: "/optimize", icon: Sparkles },
  { title: "Job Matches", href: "/matches", icon: Target, badge: "New" },
  { title: "Templates", href: "/templates", icon: LayoutTemplate },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
];
