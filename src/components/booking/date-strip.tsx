"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface DateStripProps {
  value?: string;
  minDate?: string;
  /** Number of days to show from minDate (default 21). */
  days?: number;
  onChange: (date: string) => void;
  error?: string;
  className?: string;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

/**
 * Horizontal scrollable day strip — design-spec date picker.
 * Uses real calendar dates only; no invented availability.
 */
export function DateStrip({
  value,
  minDate,
  days = 21,
  onChange,
  error,
  className,
}: DateStripProps) {
  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const min = minDate ?? todayIso;

  const options = useMemo(() => {
    const start = parseIso(min);
    const out: Array<{ iso: string; weekday: string; day: number; month: string }> = [];
    for (let i = 0; i < days; i += 1) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      out.push({
        iso: toIsoDate(d),
        weekday: d.toLocaleDateString(undefined, { weekday: "short" }),
        day: d.getDate(),
        month: d.toLocaleDateString(undefined, { month: "short" }),
      });
    }
    return out;
  }, [days, min]);

  return (
    <div className={className}>
      <div
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="listbox"
        aria-label="Select date"
      >
        {options.map((opt) => {
          const selected = value === opt.iso;
          return (
            <button
              key={opt.iso}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onChange(opt.iso)}
              className={cn(
                "flex min-w-[4.25rem] shrink-0 flex-col items-center rounded-2xl border px-3 py-3 transition-all duration-150 active:scale-[0.98]",
                selected
                  ? "border-[var(--ml-dark-mint)] bg-[var(--ml-dark-mint)] text-[var(--color-accent-foreground)] shadow-[0_0_20px_rgb(8_224_212_/_0.28)]"
                  : "border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] text-[var(--ml-dark-ink)] hover:border-[var(--ml-dark-border-strong)]",
              )}
            >
              <span
                className={cn(
                  "text-[11px] font-medium uppercase tracking-wide",
                  selected ? "text-[var(--color-accent-foreground)]/80" : "text-[var(--ml-dark-ink-muted)]",
                )}
              >
                {opt.weekday}
              </span>
              <span className="mt-0.5 text-lg font-semibold tabular-nums">{opt.day}</span>
              <span
                className={cn(
                  "text-[10px]",
                  selected ? "text-[var(--color-accent-foreground)]/75" : "text-[var(--ml-dark-ink-subtle)]",
                )}
              >
                {opt.month}
              </span>
            </button>
          );
        })}
      </div>
      {error ? <p className="mt-2 text-sm text-error">{error}</p> : null}
    </div>
  );
}
