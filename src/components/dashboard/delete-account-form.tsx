"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@/components/ui";
import { ACCOUNT_DELETE_CONFIRM_PHRASE } from "@/lib/account/delete";
import { routes } from "@/config/site";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/config/env";

export function DeleteAccountForm() {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        data?: { ok?: boolean };
      };

      if (response.status === 401) {
        router.push(routes.signIn);
        return;
      }

      if (!response.ok) {
        setError(payload.error ?? "Could not delete this account.");
        return;
      }

      if (hasSupabaseEnv()) {
        try {
          const supabase = createClient();
          await supabase.auth.signOut();
        } catch {
          // Server already banned the user; continue to sign-in.
        }
      }

      router.replace(`${routes.signIn}?deleted=1`);
      router.refresh();
    } catch {
      setError("Could not delete this account.");
    } finally {
      setBusy(false);
    }
  }

  const confirmed = confirm.trim() === ACCOUNT_DELETE_CONFIRM_PHRASE;

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-muted">
        This anonymizes your profile and disables sign-in. Booking and payment records needed for
        receipts and audit are kept without your name, phone, or login email. This cannot be undone.
      </p>
      <div>
        <Label htmlFor="delete-confirm">Type {ACCOUNT_DELETE_CONFIRM_PHRASE} to confirm</Label>
        <Input
          id="delete-confirm"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          autoComplete="off"
          className="mt-2"
          placeholder={ACCOUNT_DELETE_CONFIRM_PHRASE}
        />
      </div>
      {error ? <p className="text-sm text-error">{error}</p> : null}
      <Button
        type="button"
        variant="secondary"
        disabled={busy || !confirmed}
        onClick={() => void handleDelete()}
        className="border-error/40 text-error hover:border-error hover:bg-error/10"
      >
        {busy ? "Deleting…" : "Delete account"}
      </Button>
    </div>
  );
}
