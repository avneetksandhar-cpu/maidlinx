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
}

/** Cadence preference only — does not enable Stripe recurring charges. */
export function RecurringFrequencyPicker({
  value,
  onChange,
}: RecurringFrequencyPickerProps) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-[12px] font-medium uppercase tracking-wide text-ink-muted">
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
                  ? "border-accent bg-[#F1F8F5]"
                  : "border-[#E2E9E6] bg-white hover:border-[#C5D8CE]",
              )}
            >
              <span className="block text-[15px] font-medium text-ink">{option.label}</span>
              <span className="mt-0.5 block text-xs text-ink-muted">{option.description}</span>
            </button>
          );
        })}
      </div>
      <p className="text-xs leading-relaxed text-ink-subtle">{RECURRING_TERMS}</p>
    </fieldset>
  );
}
