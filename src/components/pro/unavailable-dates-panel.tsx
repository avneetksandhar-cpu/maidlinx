"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Input, Label } from "@/components/ui";
import type { UnavailableDate } from "@/lib/cleaners/unavailable-dates";

export function UnavailableDatesPanel({ dates }: { dates: UnavailableDate[] }) {
  const router = useRouter();
  const [day, setDay] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function add() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/cleaner/unavailable-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unavailableDate: day, reason: reason || null }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error ?? "Could not block date.");
        return;
      }
      setDay("");
      setReason("");
      router.refresh();
    });
  }

  function remove(unavailableDate: string) {
    startTransition(async () => {
      await fetch("/api/cleaner/unavailable-dates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unavailableDate }),
      });
      router.refresh();
    });
  }

  return (
    <section className="mt-8 space-y-3">
      <h2 className="font-display text-lg font-semibold text-navy">Time off</h2>
      <p className="text-sm text-ink-muted">Block full days so matching skips you.</p>
      <div className="rounded-xl border border-border bg-surface px-4 py-4 space-y-3">
        <div>
          <Label htmlFor="off-date">Date</Label>
          <Input id="off-date" type="date" value={day} onChange={(e) => setDay(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="off-reason">Reason (optional)</Label>
          <Input
            id="off-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Vacation"
          />
        </div>
        <Button className="w-full" disabled={pending || !/^\d{4}-\d{2}-\d{2}$/.test(day)} onClick={add}>
          Block day
        </Button>
        {error ? <p className="text-sm text-error">{error}</p> : null}
      </div>
      {dates.length === 0 ? (
        <p className="text-sm text-ink-muted">No blocked days.</p>
      ) : (
        dates.map((item) => (
          <div
            key={item.id}
            className="flex min-h-12 items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
          >
            <div>
              <p className="font-medium text-ink">{item.unavailableDate}</p>
              {item.reason ? <p className="text-xs text-ink-muted">{item.reason}</p> : null}
            </div>
            <Button variant="ghost" size="sm" disabled={pending} onClick={() => remove(item.unavailableDate)}>
              Remove
            </Button>
          </div>
        ))
      )}
    </section>
  );
}
