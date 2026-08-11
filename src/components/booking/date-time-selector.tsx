"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";
import { ARRIVAL_WINDOWS } from "@/lib/bookings/constants";
import { SQUARE_FOOTAGE_OPTIONS } from "@/lib/bookings/booking-state";
import { Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";

interface DateTimeSelectorProps {
  date?: string;
  arrivalWindow?: string;
  squareFootage?: number;
  onDateChange: (date: string) => void;
  onWindowChange: (window: string) => void;
  onSquareFootageChange?: (sqft: number) => void;
  showSize?: boolean;
  sizeOnly?: boolean;
  errors?: Record<string, string>;
}

export function DateTimeSelector({
  date,
  arrivalWindow,
  squareFootage,
  onDateChange,
  onWindowChange,
  onSquareFootageChange,
  showSize = false,
  sizeOnly = false,
  errors = {},
}: DateTimeSelectorProps) {
  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  return (
    <div className="space-y-6">
      {showSize && onSquareFootageChange ? (
        <div>
          <Label htmlFor="squareFootage" className="text-sm text-ink-muted">
            Home size
          </Label>
          <select
            id="squareFootage"
            value={squareFootage ?? 1500}
            onChange={(e) => onSquareFootageChange(Number(e.target.value))}
            className={cn(
              "booking-input-lg mt-2 w-full rounded-xl border bg-surface text-ink transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
              errors.squareFootage ? "border-error" : "border-border",
            )}
          >
            {SQUARE_FOOTAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.squareFootage ? (
            <p className="mt-2 text-sm text-error">{errors.squareFootage}</p>
          ) : null}
        </div>
      ) : null}

      {!sizeOnly ? (
        <>
          <div>
            <Label htmlFor="date" className="text-sm text-ink-muted">
              Preferred date
            </Label>
            <Input
              id="date"
              type="date"
              min={minDate}
              value={date ?? ""}
              onChange={(e) => onDateChange(e.target.value)}
              invalid={Boolean(errors.date)}
              className="booking-input-lg mt-2 rounded-xl"
            />
            {errors.date ? <p className="mt-2 text-sm text-error">{errors.date}</p> : null}
          </div>

          <fieldset>
            <legend className="mb-3 block text-sm font-medium text-ink-muted">
              Arrival window
            </legend>
            <div className="grid gap-2.5">
              {ARRIVAL_WINDOWS.map((window) => {
                const selected = arrivalWindow === window.id;
                return (
                  <button
                    key={window.id}
                    type="button"
                    onClick={() => onWindowChange(window.id)}
                    aria-pressed={selected}
                    data-selected={selected}
                    className="booking-select-card items-start"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-semibold text-ink">{window.label}</span>
                      <span className="mt-0.5 block text-sm text-ink-muted">{window.description}</span>
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150",
                        selected
                          ? "border-accent bg-accent text-white"
                          : "border-border bg-surface text-transparent",
                      )}
                      aria-hidden
                    >
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.arrivalWindow ? (
              <p className="mt-2 text-sm text-error">{errors.arrivalWindow}</p>
            ) : null}
          </fieldset>
        </>
      ) : null}
    </div>
  );
}
