"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function OwnerExceptionActions({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setStatus(status: "acknowledged" | "resolved" | "ignored") {
    startTransition(async () => {
      await fetch("/api/owner/exceptions", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {(["acknowledged", "resolved", "ignored"] as const).map((status) => (
        <button
          key={status}
          type="button"
          disabled={pending}
          onClick={() => setStatus(status)}
          className="rounded-md border border-border px-2 py-1 text-[11px] text-ink hover:bg-surface-muted disabled:opacity-50"
        >
          {status}
        </button>
      ))}
    </div>
  );
}
