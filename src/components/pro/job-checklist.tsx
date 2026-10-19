"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";
import { checklistCounts, type ChecklistItem } from "@/lib/pro/dashboard/checklist";
import { cn } from "@/lib/utils";

interface JobChecklistProps {
  jobId: string;
  items: ChecklistItem[];
  disabled?: boolean;
  showProgressBar?: boolean;
  title?: string;
}

export function JobChecklist({
  jobId,
  items,
  disabled = false,
  showProgressBar = false,
  title = "Service checklist",
}: JobChecklistProps) {
  const router = useRouter();
  const [checklist, setChecklist] = useState(items);
  const [saving, setSaving] = useState(false);

  const { done, total } = checklistCounts(checklist);
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  async function toggleItem(id: string) {
    if (disabled) return;

    const next = checklist.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item,
    );
    setChecklist(next);
    setSaving(true);

    try {
      await fetch(`/api/cleaner/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checklist", checklist: next }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-[var(--ml-dark-ink)]">{title}</h3>
        {showProgressBar ? (
          <span className="text-sm font-medium tabular-nums text-[var(--ml-dark-mint)]">
            {done} of {total}
          </span>
        ) : null}
      </div>

      {showProgressBar ? (
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--ml-dark-surface-2)]">
          <div
            className="h-full rounded-full bg-[var(--ml-dark-mint)] transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : null}

      <ul className="space-y-1">
        {checklist.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              disabled={disabled || saving}
              onClick={() => void toggleItem(item.id)}
              className={cn(
                "flex w-full min-h-12 items-center gap-3 rounded-xl px-1 py-2.5 text-left text-[15px] transition-colors",
                "disabled:opacity-60",
                item.completed
                  ? "text-[var(--ml-dark-ink)]"
                  : "text-[var(--ml-dark-ink)] active:bg-[var(--ml-dark-surface-2)]",
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
                  item.completed
                    ? "border-[var(--ml-dark-mint)] bg-[var(--ml-dark-mint)] text-[var(--color-accent-foreground)]"
                    : "border-[var(--ml-dark-border-strong)] bg-transparent",
                )}
                aria-hidden
              >
                {item.completed ? <Check className="size-3.5" strokeWidth={3} /> : null}
              </span>
              <span className={cn(item.completed && "text-[var(--ml-dark-ink-muted)]")}>
                {item.label}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {checklist.length === 0 ? (
        <p className="text-sm text-[var(--ml-dark-ink-muted)]">No checklist items for this service.</p>
      ) : null}
      {saving ? <p className="text-xs text-[var(--ml-dark-ink-muted)]">Saving…</p> : null}
    </section>
  );
}
