"use client";

import { WingmanLogo } from "@/components/brand/WingmanLogo";
import { Button } from "@/components/ui/Button";
import { AppShell } from "@/components/layout/AppShell";
import Link from "next/link";
import { FormEvent, useState } from "react";

export function ResetRequestScreen() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setResetUrl(null);
    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        resetUrl?: string;
      };
      if (!response.ok) {
        setError(payload.error ?? "Could not request a reset.");
        return;
      }
      setMessage(payload.message ?? "Check your email for a reset link.");
      if (payload.resetUrl) {
        setResetUrl(payload.resetUrl);
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell className="justify-center">
      <div className="flex flex-col items-center text-center">
        <Link href="/auth" aria-label="Back to sign in">
          <WingmanLogo variant="lockup" size={88} />
        </Link>
        <h1 className="mt-6 text-2xl font-bold text-ink">Reset password</h1>
        <p className="mt-2 max-w-xs text-sm text-ink-muted">
          Enter your email. If an account exists, a reset link will be created.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3">
        <input
          type="email"
          required
          name="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-12 w-full rounded-full border border-border bg-surface px-4 text-sm text-ink outline-none focus:border-accent/50"
        />
        {error ? (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        ) : null}
        {message ? <p className="text-sm text-ink-muted">{message}</p> : null}
        {resetUrl ? (
          <p className="break-all text-left text-xs text-accent">
            Dev reset link:{" "}
            <Link href={resetUrl} className="underline">
              Continue
            </Link>
          </p>
        ) : null}
        <Button type="submit" size="lg" fullWidth loading={loading}>
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link href="/auth" className="text-cobalt underline-offset-2 hover:underline">
          Back to sign in
        </Link>
      </p>
    </AppShell>
  );
}
