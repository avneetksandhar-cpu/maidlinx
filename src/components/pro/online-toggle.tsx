"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";

export function OnlineToggle({
  initialOnline,
  canGoOnline,
}: {
  initialOnline: boolean;
  canGoOnline: boolean;
}) {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(initialOnline);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function toggle() {
    if (!canGoOnline && !isOnline) {
      setError("Finish onboarding and get approved before going online.");
      return;
    }
    setError(null);
    const next = !isOnline;
    setIsOnline(next);
    startTransition(async () => {
      const res = await fetch("/api/cleaner/presence", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnline: next }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setIsOnline(!next);
        setError(json?.error ?? "Could not update status.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={cn(
          "flex w-full min-h-14 items-center justify-between rounded-xl px-4 py-3 text-left transition-colors",
          isOnline
            ? "bg-teal text-white"
            : "border border-border bg-surface text-ink",
        )}
      >
        <div>
          <p className="font-display text-base font-semibold">
            {isOnline ? "You're online" : "You're offline"}
          </p>
          <p className={cn("text-sm", isOnline ? "text-white/85" : "text-ink-muted")}>
            {isOnline
              ? "Eligible for new job offers in your zones."
              : "Go online when you're ready for work."}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex h-8 w-14 items-center rounded-full px-1 transition-colors",
            isOnline ? "bg-white/25" : "bg-surface-muted",
          )}
        >
          <span
            className={cn(
              "h-6 w-6 rounded-full bg-white shadow transition-transform",
              isOnline ? "translate-x-6" : "translate-x-0",
            )}
          />
        </span>
      </button>
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  );
}
