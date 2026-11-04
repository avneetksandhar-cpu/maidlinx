"use client";

import { WingmanLogo } from "@/components/brand/WingmanLogo";
import { Button } from "@/components/ui/Button";
import { AppShell } from "@/components/layout/AppShell";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function ConfirmForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Could not reset password.");
        return;
      }
      router.push("/auth");
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
        <h1 className="mt-6 text-2xl font-bold text-ink">Choose a new password</h1>
      </div>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3">
        <input
          type="password"
          required
          minLength={10}
          name="password"
          autoComplete="new-password"
          placeholder="New password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-12 w-full rounded-full border border-border bg-surface px-4 text-sm text-ink outline-none focus:border-accent/50"
        />
        {error ? (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" fullWidth loading={loading} disabled={!token}>
          Update password
        </Button>
      </form>
    </AppShell>
  );
}

export function ResetConfirmScreen() {
  return (
    <Suspense fallback={<AppShell className="justify-center"><div /></AppShell>}>
      <ConfirmForm />
    </Suspense>
  );
}
