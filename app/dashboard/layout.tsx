import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

// Authenticated, user-specific app area - no search-ranking value, and
// nothing here should be indexable regardless of what the root layout's
// default robots setting is.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

import { ThemeToggle } from "@/components/Theme/ThemeToggle";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { MobileSidebar } from "@/components/sidebar/mobile-sidebar";
import { SidebarProvider } from "@/components/sidebar/sidebar-provider";
import { safeDisplayName, safeHttpsUrl } from "@/lib/security";

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
    // user_metadata is user-writable, so it is sanitized before rendering.
    name: safeDisplayName(
      user.user_metadata?.full_name,
      safeDisplayName(user.user_metadata?.name, "User")
    ),

    email: user.email || "",
    avatarUrl: safeHttpsUrl(user.user_metadata?.avatar_url),
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-secondary">
        {/* Desktop Sidebar */}
        <AppSidebar user={accountUser} />

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
