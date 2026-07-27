import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-8 bg-card">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foregroun">
        <span className="text-primary">
          © 2026 Resume AI Optimizer. Made for Indian job seekers.
        </span>
        <nav className="flex items-center gap-4">
          <Link
            href="/legal/privacy"
            className="hover:text-foreground text-primary"
          >
            Privacy
          </Link>
          <Link
            href="/legal/terms"
            className="hover:text-foreground text-primary"
          >
            Terms
          </Link>
          <Link
            href="/legal/refund"
            className="hover:text-foreground text-primary"
          >
            Refunds
          </Link>
        </nav>
      </div>
    </footer>
  );
}
