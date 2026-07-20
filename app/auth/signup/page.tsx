"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import LoginPage from "@/app/auth/login/page";
import { createClient } from "@/lib/supabase/client";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const [authModal, setAuthModal] = useState<"login" | null>(null);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // If "Confirm email" is disabled in Supabase, a session comes back
    // immediately and the user is already signed in — send them straight in.
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    // Otherwise a confirmation email was sent — this only happens once
    // per signup, not on every login, so it won't hit the rate limit
    // the way magic links did.
    setMessage("Check your email to confirm your account, then log in.");
    setLoading(false);
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-6">
        Create your account
      </h2>

      {message && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-700 text-sm">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <OAuthButtons onError={setError} />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-2 text-xl text-muted-foreground">
            or sign up with email
          </span>
        </div>
      </div>

      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Email address
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Password
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
            Confirm password
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
          className="w-full bg-primary hover:bg-primary/90"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="text-center text-muted-foreground text-sm mt-6">
        Already have an account?{" "}
        <Button
          type="button"
          variant="link"
          onClick={() => setAuthModal("login")}
          className="text-primary hover:underline bg-transparent border-none p-0 h-auto font-normal"
        >
          Log in
        </Button>
      </p>
      {/* Modal Overlay Logic - Matches your home.tsx implementation */}
      <Dialog
        open={authModal === "login"}
        onOpenChange={(open) => {
          if (!open) setAuthModal(null);
        }}
      >
        <DialogContent className="max-w-md">
          {authModal === "login" && <LoginPage />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
