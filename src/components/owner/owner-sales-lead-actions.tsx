"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

const STAGES = [
  "lead",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
  "nurture",
] as const;

export function OwnerSalesLeadActions({
  id,
  stage,
}: {
  id: string;
  stage: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function update(patch: Record<string, unknown>) {
    startTransition(async () => {
      await fetch("/api/owner/sales", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <select
        disabled={pending}
        value={stage}
        onChange={(e) => update({ stage: e.target.value })}
        className="rounded-md border border-border bg-surface-muted px-2 py-1 text-xs"
      >
        {STAGES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          update({
            lastContactedAt: new Date().toISOString(),
            nextFollowUpAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
          })
        }
        className="rounded-md border border-border px-2 py-1 text-[11px] hover:bg-surface-muted"
      >
        Log contact +7d
      </button>
    </div>
  );
}
