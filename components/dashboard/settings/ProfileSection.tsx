"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { MAX_DISPLAY_NAME_CHARS } from "@/lib/limits";

export function ProfileSection({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const supabase = createClient();

  const [name, setName] = useState(initialName);
  const [savingName, setSavingName] = useState(false);

  const [newEmail, setNewEmail] = useState(email);
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailPending, setEmailPending] = useState(false);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name can't be empty.");
      return;
    }

    if (name.trim().length > MAX_DISPLAY_NAME_CHARS) {
      toast.error(
        `Name can't be longer than ${MAX_DISPLAY_NAME_CHARS} characters.`
      );
      return;
    }

    setSavingName(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: name.trim() },
    });
    setSavingName(false);

    if (error) {
      toast.error("Couldn't update your name. Please try again.");
      return;
    }
    toast.success("Name updated.");
  }

  async function requestEmailChange(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newEmail.trim();
    if (!trimmed || trimmed === email) return;

    setSavingEmail(true);
    // Routed through /auth/callback (the same code-exchange route used for
    // OAuth and password recovery) rather than any page directly, so the
    // confirmation code is exchanged server-side and never sits in a
    // client-rendered page's URL.
    const { error } = await supabase.auth.updateUser(
      { email: trimmed },
      {
        emailRedirectTo: `${
          window.location.origin
        }/auth/callback?next=${encodeURIComponent("/dashboard/settings")}`,
      }
    );
    setSavingEmail(false);

    if (error) {
      toast.error(
        error.status === 429
          ? "Too many requests. Please wait a minute and try again."
          : "Couldn't start the email change. Please try again."
      );
      return;
    }
    setEmailPending(true);
    // Supabase's "Secure email change" (on by default) sends a link to BOTH
    // the current and the new address; the change completes only after both
    // are clicked. That is what stops a hijacked session from silently
    // moving the account to an attacker's inbox.
    toast.success(
      "Confirmation links sent. Click the link in both your current and new inbox to finish."
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">Profile</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Your name and email address.
      </p>

      <form onSubmit={saveName} className="mt-4 flex items-end gap-3">
        <div className="flex-1">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            maxLength={MAX_DISPLAY_NAME_CHARS}
            onChange={(e) => setName(e.target.value)}
            disabled={savingName}
            className="mt-1"
          />
        </div>
        <Button
          type="submit"
          disabled={savingName || name.trim() === initialName}
        >
          {savingName ? "Saving..." : "Save"}
        </Button>
      </form>

      <form onSubmit={requestEmailChange} className="mt-5 flex items-end gap-3">
        <div className="flex-1">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            disabled={savingEmail}
            className="mt-1"
          />
          {emailPending && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              We sent confirmation links to your current address and to +{" "}
              {newEmail}. Your email won&apos;t change until you click both.
            </p>
          )}
        </div>
        <Button
          type="submit"
          variant="outline"
          disabled={savingEmail || newEmail.trim() === email}
        >
          {savingEmail ? "Sending..." : "Change"}
        </Button>
      </form>
    </div>
  );
}
