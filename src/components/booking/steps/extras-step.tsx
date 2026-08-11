"use client";

import { MotionReveal } from "@/components/motion/motion-reveal";
import { BOOKING_EXTRAS } from "@/lib/bookings/constants";
import type { BookingFormState } from "@/lib/validations/booking-flow";
import { Heading, Label } from "@/components/ui";
import { cn } from "@/lib/utils";

interface ExtrasStepProps {
  form: BookingFormState;
  onChange: (value: Partial<BookingFormState>) => void;
}

export function ExtrasStep({ form, onChange }: ExtrasStepProps) {
  return (
    <MotionReveal>
      <Heading as="h2" className="text-2xl">
        Add extras
      </Heading>
      <p className="mt-2 text-sm text-ink-muted">
        Optional add-ons. Skip any you don&apos;t need.
      </p>
      <div className="mt-6">
        <Label>Extras</Label>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {BOOKING_EXTRAS.map((extra) => {
            const selected = (form.extras ?? []).includes(extra.id);
            return (
              <label
                key={extra.id}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3",
                  selected ? "border-accent bg-accent-muted" : "border-border",
                )}
              >
                <span className="text-sm font-medium">{extra.label}</span>
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => {
                    const current = form.extras ?? [];
                    onChange({
                      extras: selected
                        ? current.filter((id) => id !== extra.id)
                        : [...current, extra.id],
                    });
                  }}
                  className="size-4 accent-[var(--color-accent)]"
                />
              </label>
            );
          })}
        </div>
      </div>
    </MotionReveal>
  );
}
