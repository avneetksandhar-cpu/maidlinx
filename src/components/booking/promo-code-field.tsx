"use client";

import { useState } from "react";
import { Button, Input, Label } from "@/components/ui";
import { useBooking } from "@/components/booking/booking-provider";

/** Customer promo entry — discount is always re-validated server-side. */
export function PromoCodeField() {
  const { state, updateState } = useBooking();
  const [draft, setDraft] = useState(state.promoCode ?? "");
  const [status, setStatus] = useState<string | null>(null);

  function apply() {
    const code = draft.trim().toUpperCase();
    updateState({ promoCode: code || undefined });
    setStatus(code ? `Promo ${code} will be checked at checkout.` : "Promo cleared.");
  }

  return (
    <div className="space-y-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
      <Label htmlFor="promo-code" className="text-[var(--color-ink-muted)]">
        Promo code
      </Label>
      <div className="flex gap-2">
        <Input
          id="promo-code"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Enter code"
          autoComplete="off"
          className="uppercase border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-ink)]"
        />
        <Button type="button" variant="secondary" size="sm" onClick={apply}>
          Apply
        </Button>
      </div>
      {status ? <p className="text-xs text-[var(--color-ink-muted)]">{status}</p> : null}
      <p className="text-[11px] text-[var(--color-ink-subtle)]">
        Discounts are validated on the server. Invalid or expired codes are rejected at payment.
      </p>
    </div>
  );
}
