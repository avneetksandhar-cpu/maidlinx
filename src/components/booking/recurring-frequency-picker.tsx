"use client";

import {
  RECURRING_FREQUENCIES,
  RECURRING_TERMS,
  type RecurringFrequencyId,
} from "@/lib/recurring/frequencies";
import { cn } from "@/lib/utils";

interface RecurringFrequencyPickerProps {
  value: RecurringFrequencyId;
  onChange: (value: RecurringFrequencyId) => void;
  /** Compact iOS-style toggle (design-spec date screen). */
  variant?: "list" | "toggle";
}

/** Cadence preference only — does not enable Stripe recurring charges. */
export function RecurringFrequencyPicker({
  value,
  onChange,
  variant = "list",
}: RecurringFrequencyPickerProps) {
  const isRecurring = value !== "one_time";

  if (variant === "toggle") {
    return (
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] px-4 py-3.5">
        <div className="min-w-0">
          <p className="text-[15px] font-medium text-[var(--ml-dark-ink)]">
            Recurring booking
          </p>
          <p className="mt-0.5 text-xs text-[var(--ml-dark-ink-muted)]">
            Save time and get 10% off — preference only until confirmed.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isRecurring}
          onClick={() => onChange(isRecurring ? "one_time" : "weekly")}
          className={cn(
            "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200",
            isRecurring ? "bg-[var(--ml-dark-mint)]" : "bg-[var(--ml-dark-border-strong)]",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition-transform duration-200",
              isRecurring && "translate-x-5",
            )}
          />
        </button>
      </div>
    );
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-[12px] font-medium uppercase tracking-wide text-[var(--ml-dark-ink-muted)]">
        Cleaning frequency
      </legend>
      <div className="grid gap-2">
        {RECURRING_FREQUENCIES.map((option) => {
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={cn(
                "rounded-2xl border px-4 py-3 text-left transition-colors",
                selected
                  ? "border-[var(--ml-dark-mint)] bg-[var(--ml-dark-surface)]"
                  : "border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] hover:border-[var(--ml-dark-border-strong)]",
              )}
            >
              <span className="block text-[15px] font-medium text-[var(--ml-dark-ink)]">
                {option.label}
              </span>
              <span className="mt-0.5 block text-xs text-[var(--ml-dark-ink-muted)]">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-xs leading-relaxed text-[var(--ml-dark-ink-subtle)]">{RECURRING_TERMS}</p>
    </fieldset>
  );
}
