"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SignupPage from "@/app/auth/signup/page";
import Link from "next/link";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const [authModal, setAuthModal] = useState<"signup" | null>(null);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      toast.error(
        error.message === "Invalid login credentials"
          ? "Incorrect email or password."
          : error.message
      );
      setLoading(false);
      return;
    }
    toast.success("Successfully logged in!");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-forgrouded mb-6">
        Sign in to your account
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <OAuthButtons onError={(err) => toast.error(err)} />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-2 text-muted-foreground">
            or continue with email
          </span>
        </div>
      </div>

      <form onSubmit={handlePasswordLogin} className="space-y-4">
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
          <div className="flex justify-between items-center mb-1">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground"
            >
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-muted-foreground text-sm mt-6">
        Don&apos;t have an account?{" "}
        <Button
          type="button"
          onClick={() => setAuthModal("signup")}
          className="text-primary hover:underline bg-transparent border-none p-0 h-auto font-normal"
          variant="link"
        >
          Sign up
        </Button>
      </p>

      {/* Modal Overlay Logic - Matches your home.tsx implementation */}
      <Dialog
        open={authModal === "signup"}
        onOpenChange={(open) => {
          if (!open) setAuthModal(null);
        }}
      >
        <DialogContent className="max-w-md">
          {authModal === "signup" && <SignupPage />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
