"use client";

import { Button } from "@/components/ui/Button";
import { INTEREST_DISCLAIMER, type InterestSource } from "@/lib/marketplace/interest";
import { useState } from "react";

export function InterestForm({
  source,
  eventId,
  heading = "Get notified",
  cta = "Get notified",
}: {
  source: InterestSource;
  eventId?: string;
  heading?: string;
  cta?: string;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setMessage(null);
    const response = await fetch("/api/interest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, notes, source, eventId }),
    });
    const payload = (await response.json()) as {
      error?: string;
      alreadyRecorded?: boolean;
      charged?: boolean;
      accessPromised?: boolean;
    };
    setLoading(false);
    if (!response.ok) {
      setMessage(payload.error ?? "Could not save your interest.");
      return;
    }
    if (payload.charged || payload.accessPromised) {
      setMessage("Interest saved. Nothing was charged.");
    } else if (payload.alreadyRecorded) {
      setMessage("You’re already on this list. Nothing was charged.");
    } else {
      setMessage("You’re on the list. We’ll notify you — no charge, no promised access.");
    }
    setEmail("");
    setName("");
    setNotes("");
  }

  return (
    <form
      className="rounded-2xl border border-border bg-surface px-4 py-5"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <p className="text-label text-accent">Waitlist</p>
      <h2 className="mt-2 text-xl text-ink">{heading}</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{INTEREST_DISCLAIMER}</p>
      <label className="mt-4 block">
        <span className="text-xs uppercase tracking-[0.14em] text-ink-subtle">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="field mt-1.5"
          placeholder="you@email.com"
        />
      </label>
      <label className="mt-3 block">
        <span className="text-xs uppercase tracking-[0.14em] text-ink-subtle">Name (optional)</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="field mt-1.5"
          placeholder="How we should greet you"
        />
      </label>
      <label className="mt-3 block">
        <span className="text-xs uppercase tracking-[0.14em] text-ink-subtle">Notes (optional)</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          className="mt-1.5 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-ink focus:border-accent/50 focus:outline-none"
          placeholder="Dates, venues, or group size — not a booking."
        />
      </label>
      {message ? <p className="mt-3 text-sm text-accent">{message}</p> : null}
      <Button type="submit" className="mt-4" fullWidth loading={loading}>
        {cta}
      </Button>
    </form>
  );
}
