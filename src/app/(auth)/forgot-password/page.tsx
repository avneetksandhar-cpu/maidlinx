"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { SiteLogo } from "@/components/brand/site-logo";
import { useSupabase } from "@/components/providers/supabase-provider";
import { Button, Container, Heading, Input, Label, Text } from "@/components/ui";
import { routes } from "@/config/site";

function ForgotPasswordForm() {
  const supabase = useSupabase();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      setError("Password reset is temporarily unavailable. Please try again shortly.");
      return;
    }
    if (!email.trim()) {
      setError("Enter the email for your account.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(routes.resetPassword)}`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });
      if (resetError) throw resetError;
      setMessage("If an account exists for that email, we sent a reset link. Check your inbox.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div>
        <Label htmlFor="email" required>
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
          placeholder="you@email.com"
        />
      </div>
      <Button type="submit" fullWidth disabled={loading || !email.trim()}>
        {loading ? "Sending…" : "Send reset link"}
      </Button>
      {error ? <p className="text-sm text-error">{error}</p> : null}
      {message ? <p className="text-sm text-[var(--ml-dark-ink-muted)]">{message}</p> : null}
      <Text muted className="text-center text-sm">
        <Link href={routes.signIn} className="font-medium text-accent hover:text-accent-hover">
          Back to sign in
        </Link>
      </Text>
    </form>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-dvh px-4 py-16">
      <Container narrow>
        <SiteLogo className="mb-8" tone="brand" priority />
        <Heading as="h1" className="text-[var(--ml-dark-ink)]">
          Reset password
        </Heading>
        <Text muted className="mt-3 text-[var(--ml-dark-ink-muted)]">
          Enter your email and we’ll send a link to choose a new password.
        </Text>
        <Suspense fallback={<Text muted className="mt-8">Loading…</Text>}>
          <ForgotPasswordForm />
        </Suspense>
      </Container>
    </div>
  );
}
