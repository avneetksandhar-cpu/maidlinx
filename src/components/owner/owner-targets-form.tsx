"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function OwnerTargetsForm({
  monthlyDollars,
  annualDollars,
}: {
  monthlyDollars: number;
  annualDollars: number;
}) {
  const router = useRouter();
  const [monthly, setMonthly] = useState(String(monthlyDollars));
  const [annual, setAnnual] = useState(String(annualDollars));
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    setOk(false);
    startTransition(async () => {
      try {
        const res = await fetch("/api/owner/targets", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            monthlyTargetDollars: Number(monthly),
            annualTargetDollars: Number(annual),
          }),
        });
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok) {
          setError(data.error ?? "Update failed.");
          return;
        }
        setOk(true);
        router.refresh();
      } catch {
        setError("Network error.");
      }
    });
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
      <p className="text-sm font-medium text-ink">Edit targets</p>
      <p className="mt-1 text-xs text-ink-muted">
        Defaults $100K / month and $1M / year. Stored in DB — not fake metrics.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-ink-muted">
          Monthly target ($)
          <input
            type="number"
            min={0}
            step={1000}
            value={monthly}
            onChange={(e) => setMonthly(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-ink"
          />
        </label>
        <label className="block text-xs text-ink-muted">
          Annual target ($)
          <input
            type="number"
            min={0}
            step={10000}
            value={annual}
            onChange={(e) => setAnnual(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-ink"
          />
        </label>
      </div>
      {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
      {ok && <p className="mt-2 text-sm text-emerald-700">Targets saved.</p>}
      <button
        type="button"
        disabled={pending}
        onClick={save}
        className="mt-3 rounded-md bg-ink px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save targets"}
      </button>
    </div>
  );
}
