"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteLogo } from "@/components/brand/site-logo";
import { useSupabase } from "@/components/providers/supabase-provider";
import { Button, Container, Heading, Input, Label, Text } from "@/components/ui";
import { routes } from "@/config/site";

function ResetPasswordForm() {
  const supabase = useSupabase();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      setError("Password reset is temporarily unavailable. Please try again shortly.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setMessage("Password updated. Taking you to your account…");
      router.replace(routes.account);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update password. Request a new reset link from sign in.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div>
        <Label htmlFor="password" required>
          New password
        </Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <div>
        <Label htmlFor="confirm" required>
          Confirm password
        </Label>
        <Input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <Button type="submit" fullWidth disabled={loading || password.length < 8}>
        {loading ? "Saving…" : "Update password"}
      </Button>
      {error ? <p className="text-sm text-error">{error}</p> : null}
      {message ? <p className="text-sm text-[var(--ml-dark-ink-muted)]">{message}</p> : null}
      <Text muted className="text-center text-sm">
        <Link href={routes.forgotPassword} className="font-medium text-accent hover:text-accent-hover">
          Request a new link
        </Link>
      </Text>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-dvh px-4 py-16">
      <Container narrow>
        <SiteLogo className="mb-8" tone="brand" priority />
        <Heading as="h1" className="text-[var(--ml-dark-ink)]">
          Choose a new password
        </Heading>
        <Text muted className="mt-3 text-[var(--ml-dark-ink-muted)]">
          Use the link from your email, then set a new password below.
        </Text>
        <Suspense fallback={<Text muted className="mt-8">Loading…</Text>}>
          <ResetPasswordForm />
        </Suspense>
      </Container>
    </div>
  );
}
