"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import type { StripeConnectStatus } from "@/lib/cleaners/onboarding";

export function ConnectPayoutCard({ initialStatus }: { initialStatus: StripeConnectStatus }) {
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function startConnect() {
    setMessage(null);
    startTransition(async () => {
      const res = await fetch("/api/cleaner/connect", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(json?.error ?? "Connect is not ready yet (TEST keys / platform setup).");
        return;
      }
      setStatus(json?.data?.status ?? "PENDING");
      if (json?.data?.mode === "stub") {
        setMessage(
          "Connect architecture stub saved. Enable STRIPE_CONNECT_ENABLED=true with TEST keys for real Account Links.",
        );
        return;
      }
      if (json?.data?.url) {
        window.location.href = json.data.url as string;
      }
    });
  }

  return (
    <div className="mb-6 rounded-xl border border-border bg-surface px-4 py-4">
      <p className="text-sm text-ink-muted">Payouts (Stripe Connect)</p>
      <p className="mt-1 font-display text-lg font-semibold text-navy">{status}</p>
      <p className="mt-2 text-sm text-ink-muted">
        Bank details are never entered in MaidLinx. Hosted Stripe onboarding only — TEST mode.
      </p>
      <Button className="mt-4 w-full" disabled={pending || status === "ENABLED"} onClick={startConnect}>
        {status === "ENABLED" ? "Payouts enabled" : "Set up payouts"}
      </Button>
      {message ? <p className="mt-2 text-sm text-ink-muted">{message}</p> : null}
    </div>
  );
}
