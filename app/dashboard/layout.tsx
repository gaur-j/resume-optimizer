import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/Theme/ThemeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

  return (
    <div className="min-h-screen flex flex-col bg-secondary">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="text-xl sm:text-2xl font-bold text-foreground"
          >
            Resume<span className="text-primary">AI</span>
          </Link>

          {/* Right Side */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Hide email on very small screens */}
            <Avatar className="h-8 w-8 md:hidden">
              <AvatarFallback className="text-muted-foreground bg-card text-xl font-sans shadow-xl">
                {user.email?.[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span
              className="hidden md:block text-sm text-muted-foreground truncate max-w-[200px]"
              title={user.email ?? undefined}
            >
              {user.email}
            </span>

            <ThemeToggle />

            <form action="/auth/logout" method="POST">
              <Button variant="outline" size="sm" type="submit">
                Logout
              </Button>
            </form>
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
  );
}
