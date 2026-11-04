"use client";

import {
  Check,
  Refrigerator,
  Flame,
  LayoutGrid,
  Shirt,
  AppWindow,
  Warehouse,
  Trees,
  type LucideIcon,
} from "lucide-react";
import { BOOKING_EXTRAS } from "@/lib/bookings/constants";
import type { BookingExtraId } from "@/lib/bookings/constants";
import { formatCurrency, cn } from "@/lib/utils";

const EXTRA_ICONS: Record<BookingExtraId, LucideIcon> = {
  inside_fridge: Refrigerator,
  inside_oven: Flame,
  inside_cabinets: LayoutGrid,
  laundry: Shirt,
  windows: AppWindow,
  garage: Warehouse,
  patio: Trees,
};

interface ExtrasSelectorProps {
  value: BookingExtraId[];
  onChange: (extras: BookingExtraId[]) => void;
  hideLegend?: boolean;
}

export function ExtrasSelector({ value, onChange, hideLegend = false }: ExtrasSelectorProps) {
  const toggle = (id: BookingExtraId) => {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  };

  return (
    <fieldset>
      {!hideLegend ? (
        <legend className="mb-3 block text-sm font-medium text-ink-muted">Optional extras</legend>
      ) : null}
      <div className="grid gap-2.5 sm:grid-cols-2">
        {BOOKING_EXTRAS.map((extra) => {
          const selected = value.includes(extra.id);
          const Icon = EXTRA_ICONS[extra.id] ?? Check;
          return (
            <button
              key={extra.id}
              type="button"
              onClick={() => toggle(extra.id)}
              aria-pressed={selected}
              data-selected={selected}
              className={cn(
                "booking-select-card transition-transform duration-150 active:scale-[0.99]",
                selected
                  ? "border-[var(--ml-book-primary,#04CED2)] bg-[var(--ml-book-selected,#E6FAFA)]"
                  : undefined,
              )}
            >
              <span className="flex min-w-0 flex-1 items-center gap-3">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors duration-150",
                    selected
                      ? "border-[var(--ml-book-primary,#04CED2)] bg-[var(--ml-book-primary,#04CED2)] text-[var(--ml-book-ink,#01193D)]"
                      : "border-[var(--ml-book-border-strong,#cbd5e1)] bg-white text-transparent",
                  )}
                  aria-hidden
                >
                  {selected ? <Check className="size-3.5" strokeWidth={3} /> : null}
                </span>
                <span className="flex items-center gap-2 text-base font-medium text-[var(--ml-book-ink,#01193D)]">
                  <Icon className="size-4 shrink-0 opacity-70" strokeWidth={2} aria-hidden />
                  {extra.label}
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-[var(--ml-book-ink,#01193D)]">
                +{formatCurrency(extra.priceCents)}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
