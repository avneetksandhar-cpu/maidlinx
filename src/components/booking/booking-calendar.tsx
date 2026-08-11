"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingCalendarProps {
  value?: string;
  minDate?: string;
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

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function BookingCalendar({
  value,
  minDate,
  onChange,
  error,
  className,
}: BookingCalendarProps) {
  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const min = minDate ?? todayIso;
  const initial = value ? parseIso(value) : parseIso(min);

  const [cursor, setCursor] = useState(() => new Date(initial.getFullYear(), initial.getMonth(), 1));

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out: Array<{ iso: string; day: number; inMonth: boolean } | null> = [];

    for (let i = 0; i < firstDow; i += 1) out.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      const iso = toIsoDate(new Date(year, month, day));
      out.push({ iso, day, inMonth: true });
    }
    return out;
  }, [cursor]);

  const monthLabel = cursor.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const canGoPrev = (() => {
    const prevMonthEnd = new Date(cursor.getFullYear(), cursor.getMonth(), 0);
    return toIsoDate(prevMonthEnd) >= min;
  })();

  return (
    <div className={cn("rounded-2xl border border-[#E2E9E6] bg-white p-4 shadow-soft", className)}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() =>
            setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
          }
          disabled={!canGoPrev}
          className="inline-flex size-9 items-center justify-center rounded-xl text-ink transition-colors duration-200 hover:bg-[#F1F8F5] disabled:opacity-35"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <p className="text-[15px] font-semibold text-ink">{monthLabel}</p>
        <button
          type="button"
          onClick={() =>
            setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
          }
          className="inline-flex size-9 items-center justify-center rounded-xl text-ink transition-colors duration-200 hover:bg-[#F1F8F5]"
          aria-label="Next month"
        >
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d) => (
          <span key={d} className="pb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
            {d}
          </span>
        ))}
        {cells.map((cell, idx) => {
          if (!cell) {
            return <span key={`empty-${idx}`} className="aspect-square" aria-hidden />;
          }
          const disabled = cell.iso < min;
          const selected = value === cell.iso;
          const isToday = cell.iso === todayIso;
          return (
            <button
              key={cell.iso}
              type="button"
              disabled={disabled}
              onClick={() => onChange(cell.iso)}
              aria-pressed={selected}
              aria-label={cell.iso}
              className={cn(
                "aspect-square rounded-xl text-sm font-medium transition-all duration-150",
                disabled && "cursor-not-allowed text-ink-subtle/50",
                !disabled && !selected && "text-ink hover:bg-[#F1F8F5]",
                selected && "bg-accent text-white shadow-[0_6px_14px_rgb(8_127_101_/_0.28)]",
                isToday && !selected && "ring-1 ring-accent/35",
              )}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}
    </div>
  );
}
