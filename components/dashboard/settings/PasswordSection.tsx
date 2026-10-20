"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

// Maps Supabase Auth error codes to messages a person can act on. Only codes
// whose text is safe to show are surfaced; everything else stays generic.
function passwordUpdateMessage(error: { code?: string; message?: string }) {
  const code = error.code ?? "";

  if (code.startsWith("current_password")) {
    return "Current password is incorrect.";
  }
  if (code === "same_password") {
    return "Your new password must be different from your current one.";
  }
  if (code === "weak_password") {
    return (
      error.message ||
      "That password is too weak. Try a longer one with a mix of characters."
    );
  }
  if (code === "reauthentication_needed") {
    return "For your security, please sign out, sign back in, and try again.";
  }
  return "Couldn't update your password. Please try again.";
}

export function PasswordSection({ email }: { email: string }) {
  const supabase = createClient();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);

    // Two layers, on purpose:
    //
    // 1) UX check (this block): re-sign-in with the typed current password so
    //    a typo gets a clear message. This runs in the BROWSER, so it is not a
    //    security control - anyone holding a session token can skip this UI
    //    and call the Supabase Auth API directly.
    //
    // 2) Server enforcement (the updateUser call below): it also sends
    //    `current_password`. When "Require current password when changing
    //    password" is enabled in the Supabase dashboard (Authentication ->
    //    Sign In / Providers -> Email), Supabase itself rejects the change
    //    unless that password is correct - THAT is what stops a stolen
    //    session. See docs/SUPABASE_AUTH_SETTINGS.md. Until the setting is on,
    //    the server ignores the field and only layer 1 applies.

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (verifyError) {
      setError("Current password is incorrect.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
      current_password: currentPassword,
    });

    if (updateError) {
      setError(passwordUpdateMessage(updateError));
      setLoading(false);
      return;
    }

    // Same hardening as the email reset flow: revoke any other active
    // sessions now that the password has changed, keeping this one signed
    // in since it just proved both the current password and a live
    // session.
    await supabase.auth.signOut({ scope: "others" }).catch(() => {});

    toast.success("Password updated.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setLoading(false);
  }

  return (
    <div
      id="password"
      className="rounded-xl border border-border bg-card p-6 shadow-sm scroll-mt-20"
    >
      <h2 className="text-lg font-semibold text-foreground">
        Password &amp; Security
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Update your password. You&apos;ll stay signed in here; other devices
        will be signed out.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <Label htmlFor="currentPassword">Current password</Label>
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            disabled={loading}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            type="password"
            placeholder="At least 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            disabled={loading}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="confirmNewPassword">Confirm new password</Label>
          <Input
            id="confirmNewPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            disabled={loading}
            className="mt-1"
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update password"}
        </Button>
      </form>
    </div>
  );
}
