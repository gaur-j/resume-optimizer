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
    avatarUrl: user.user_metadata?.avatar_url as string | undefined,
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-secondary">
        {/* Desktop sidebar — owns its own account menu + sign-out now,
            pinned to the bottom of the rail. */}
        <AppSidebar user={accountUser} />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-50 border-b border-border bg-card">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2">
                {/* Hamburger + drawer — mobile only. Carries its own
                    account menu + sign-out, so mobile never needs any
                    extra header chrome. */}
                <MobileSidebar user={accountUser} />

                {/* Brand — mobile only. On desktop, AppSidebar already
                    shows this in its own header row, so repeating it
                    here would just be clutter. */}
                <Link
                  href="/dashboard"
                  className="text-xl font-bold text-foreground md:hidden"
                >
                  Resume<span className="text-primary">AI</span>
                </Link>
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
