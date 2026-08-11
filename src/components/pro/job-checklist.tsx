"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui";
import { checklistProgress, type ChecklistItem } from "@/lib/pro/dashboard/checklist";

interface JobChecklistProps {
  jobId: string;
  items: ChecklistItem[];
  disabled?: boolean;
}

export function JobChecklist({ jobId, items, disabled = false }: JobChecklistProps) {
  const router = useRouter();
  const [checklist, setChecklist] = useState(items);
  const [saving, setSaving] = useState(false);

  const progress = checklistProgress(checklist);

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
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-ink">Job checklist</h3>
          <span className="text-sm font-medium text-gold">{progress}%</span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-gold transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <ul className="space-y-2">
          {checklist.map((item) => (
            <li key={item.id}>
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
                  item.completed
                    ? "border-gold/30 bg-gold-muted/50"
                    : "border-border hover:bg-surface-muted"
                } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  disabled={disabled || saving}
                  onChange={() => toggleItem(item.id)}
                  className="h-4 w-4 accent-gold"
                />
                <span className={item.completed ? "text-ink-muted line-through" : "text-ink"}>
                  {item.label}
                </span>
              </label>
            </li>
          ))}
        </ul>

        {saving && <p className="text-xs text-ink-muted">Saving...</p>}
      </CardContent>
    </Card>
  );
}
