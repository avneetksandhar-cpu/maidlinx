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
              )}
            >
              <span className="flex min-w-0 flex-1 items-center gap-3">
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-150",
                    selected ? "bg-accent text-white" : "bg-surface-muted text-navy",
                  )}
                  aria-hidden
                >
                  <Icon className="size-5" strokeWidth={2} />
                </span>
                <span className="text-base font-medium text-ink">{extra.label}</span>
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                +{formatCurrency(extra.priceCents)}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
