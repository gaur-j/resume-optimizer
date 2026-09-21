import type { Metadata } from "next";
import Link from "next/link";

// Login/signup/password-reset/logout/OAuth-callback are all transactional
// utility flows with no unique content to rank, and reset-password in
// particular briefly carries a one-time token in its URL - none of this
// tree should be indexed regardless of the root layout's default.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-secondary px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-md flex-col rounded-2xl border border-gray-500/30 bg-card p-8 shadow-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-foreground">
            Resume<span className="text-primary">AI</span>
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            Resume ATS score checker
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}
