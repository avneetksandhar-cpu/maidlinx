"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { AiFlagKey } from "@/lib/ai/flags";

export interface OwnerFlagView {
  key: string;
  enabled: boolean;
  description: string | null;
}

const TOGGLEABLE: AiFlagKey[] = [
  "AI_GLOBAL_PAUSE",
  "AI_SIMULATION_MODE",
  "AI_REVENUE_DIRECTOR",
  "AI_OPS_DIRECTOR",
  "AI_RETENTION_DIRECTOR",
  "AI_B2B_SALES_DIRECTOR",
  "AI_GROWTH_DIRECTOR",
  "AI_CHIEF_OF_STAFF",
];

export function OwnerControls({ initialFlags }: { initialFlags: OwnerFlagView[] }) {
  const router = useRouter();
  const [flags, setFlags] = useState(initialFlags);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(key: string, enabled: boolean) {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/owner/flags", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ key, enabled }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          flags?: OwnerFlagView[];
        };
        if (!res.ok) {
          setError(data.error ?? "Update failed.");
          return;
        }
        if (data.flags) setFlags(data.flags);
        router.refresh();
      } catch {
        setError("Network error updating flag.");
      }
    });
  }

  const byKey = new Map(flags.map((f) => [f.key, f]));

  return (
    <section id="controls" className="mb-10 scroll-mt-6">
      <h2 className="font-display text-xl font-semibold text-ink">Controls</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Global pause and per-agent switches. Changes persist in DB (no redeploy). Outbound auto-send
        stays hard-off.
      </p>

      {error && (
        <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {error}
        </p>
      )}

      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {TOGGLEABLE.map((key) => {
          const flag = byKey.get(key);
          const enabled = flag?.enabled ?? false;
          const isPause = key === "AI_GLOBAL_PAUSE";
          return (
            <li
              key={key}
              className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface p-4 shadow-card"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{key}</p>
                <p className="mt-1 text-xs text-ink-muted">
                  {flag?.description ??
                    (isPause
                      ? "Stops all AI agent work when ON."
                      : "Agent / mode toggle.")}
                </p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => toggle(key, !enabled)}
                className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
                  enabled
                    ? isPause
                      ? "bg-rose-600 text-white"
                      : "bg-emerald-700 text-white"
                    : "bg-border text-ink-muted"
                }`}
              >
                {isPause ? (enabled ? "Paused" : "Running") : enabled ? "On" : "Off"}
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-xs text-ink-subtle">
        AI_OUTBOUND_AUTO_SEND is locked OFF. AI_BUSINESS_EVENTS defaults ON (soft-fail mirrors).
      </p>
    </section>
  );
}
