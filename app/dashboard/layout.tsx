import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

import { ThemeToggle } from "@/components/Theme/ThemeToggle";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { MobileSidebar } from "@/components/sidebar/mobile-sidebar";
import { SidebarProvider } from "@/components/sidebar/sidebar-provider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const accountUser = {
    name: user.user_metadata?.full_name || user.user_metadata?.name || "User",
    email: user.email || "",
    avatarUrl:
      typeof user.user_metadata?.avatar_url === "string"
        ? user.user_metadata.avatar_url
        : undefined,
  };

  return (
    <SidebarProvider>
      {/* CHANGED: min-h-screen -> h-screen overflow-hidden. This turns the
          whole dashboard into a fixed-height app shell so the DOCUMENT
          itself never scrolls — that's what was letting the sidebar
          scroll away with the rest of the page. */}
      <div className="flex h-screen overflow-hidden bg-secondary">
        {/* Desktop Sidebar */}
        <AppSidebar user={accountUser} />

        {/* CHANGED: added overflow-y-auto. This column (header + main)
            is now its own independent scroll container — everything
            inside it scrolls without moving the sidebar, which sits
            outside this container entirely. */}
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          {/* Header */}
          <header className="sticky top-0 z-40 border-b border-border bg-card">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              {/* Left side */}
              <div className="flex items-center gap-3">
                {/* Mobile menu */}
                <div className="md:hidden">
                  <MobileSidebar user={accountUser} />
                </div>

                {/* Mobile logo */}
                <Link
                  href="/dashboard"
                  aria-label="ResumeAI Dashboard"
                  className="text-xl font-bold text-foreground"
                >
                  Resume<span className="text-primary">AI</span>
                </Link>

                {/* Desktop logo fallback */}
                <Link
                  href="/dashboard"
                  aria-label="ResumeAI Dashboard"
                  className="hidden text-xl font-bold text-foreground md:max-lg:block"
                >
                  Resume<span className="text-primary">AI</span>
                </Link>
              </div>

              {/* Right side */}
              <div className="flex items-center gap-2 sm:gap-4">
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="min-w-0 flex-1">
            <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
