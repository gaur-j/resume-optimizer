"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type LinkStatus = "checking" | "valid" | "invalid";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [linkStatus, setLinkStatus] = useState<LinkStatus>("checking");
  const router = useRouter();
  const supabase = createClient();

  // The reset link is exchanged for a session server-side in
  // /auth/callback before this page ever loads, so by the time we're
  // here there should already be an authenticated (recovery) session in
  // cookies. We verify that explicitly - via getUser(), which checks with
  // Supabase rather than trusting whatever is in local state - instead of
  // letting the form render unconditionally and only discovering an
  // expired/invalid/already-used link when the update itself fails.
  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      setLinkStatus(!error && data.user ? "valid" : "invalid");
    });

    return () => {
      active = false;
    };
  }, [supabase]);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      // Don't surface Supabase's raw error text - map to a small set of
      // safe, generic messages instead. A missing/expired session is the
      // one case worth naming specifically, since the fix (request a new
      // link) is different from "try again".
      if (error.status === 401 || error.status === 403) {
        setLinkStatus("invalid");
      } else {
        setError(
          "Couldn't update your password. Please try again or request a new reset link."
        );
      }
      setLoading(false);
      return;
    }

    // Revoke any other active sessions for this account (other browsers/
    // devices) now that the password has changed, while keeping this
    // session - the one that just proved email ownership - signed in.
    // Best-effort: a failure here shouldn't block the user from reaching
    // their dashboard.
    await supabase.auth.signOut({ scope: "others" }).catch(() => {});

    router.push("/dashboard");
    router.refresh();
  }

  if (linkStatus === "checking") {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Checking your reset link…
      </div>
    );
  }

  if (linkStatus === "invalid") {
    return (
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          This link has expired
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Password reset links are single-use and expire after a short time.
          Request a new one to continue.
        </p>
        <Button
          render={<Link href="/auth/forgot-password" />}
          className="w-full"
        >
          Request a new link
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-6">
        Set a new password
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-foreground mb-1"
          >
            New password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            minLength={8}
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Confirm new password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            minLength={8}
          />
        </div>

        <Button
          type="submit"
          className="w-full text-foreground hover:bg-primary/90"
          disabled={loading}
        >
          {loading ? "Updating..." : "Update password"}
        </Button>
      </form>
    </div>
  );
}
