"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";

interface VerificationState {
  identityStatus?: string;
  backgroundStatus?: string;
  identityProviderConnected?: boolean;
  backgroundProviderConnected?: boolean;
  requiresAdminReview?: boolean;
}

export function CleanerVerificationPanel() {
  const [state, setState] = useState<VerificationState | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cleaner/verification")
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.data) setState(json.data);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function run(action: "start_identity" | "start_background") {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/cleaner/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Request failed");
      setState(json.data);
      setMessage(
        action === "start_identity"
          ? "Identity verification started. Provider pending requires admin review — never auto-approved."
          : "Background screening started. Until a provider is connected, status stays pending for admin review.",
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function confirmContact(kind: "confirm_email" | "confirm_phone") {
    setLoading(true);
    try {
      const res = await fetch("/api/cleaner/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: kind }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setMessage(kind === "confirm_email" ? "Email confirmed." : "Phone confirmed.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  if (!state) {
    return <div className="h-40 animate-pulse rounded-xl bg-border" />;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface p-4 text-sm">
        <p className="font-medium text-ink">Identity: {state.identityStatus ?? "—"}</p>
        <p className="mt-1 text-ink-muted">
          Provider:{" "}
          {state.identityProviderConnected ? "Connected" : "PENDING (not connected)"}
        </p>
        <Button
          className="mt-3"
          size="sm"
          variant="secondary"
          disabled={loading}
          onClick={() => run("start_identity")}
        >
          Start identity verification
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4 text-sm">
        <p className="font-medium text-ink">Background: {state.backgroundStatus ?? "—"}</p>
        <p className="mt-1 text-ink-muted">
          Provider:{" "}
          {state.backgroundProviderConnected ? "Connected" : "PENDING (not connected)"}
        </p>
        <p className="mt-2 text-ink-muted">
          MaidLinx does not invent background-check results. Admin review is required while
          the screening partner is pending.
        </p>
        <Button
          className="mt-3"
          size="sm"
          variant="secondary"
          disabled={loading}
          onClick={() => run("start_background")}
        >
          Start screening request
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4 text-sm">
        <p className="font-medium text-ink">Contact confirmation</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={loading}
            onClick={() => confirmContact("confirm_email")}
          >
            Confirm email on file
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={loading}
            onClick={() => confirmContact("confirm_phone")}
          >
            Confirm phone on file
          </Button>
        </div>
      </div>

      {state.requiresAdminReview && (
        <p className="text-sm text-ink-muted">
          Admin review required — no automatic approval while providers are unavailable.
        </p>
      )}
      {message && <p className="text-sm text-ink-muted">{message}</p>}
    </div>
  );
}
