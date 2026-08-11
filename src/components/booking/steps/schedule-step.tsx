"use client";

import { useMemo } from "react";
import { MotionReveal } from "@/components/motion/motion-reveal";
import { ARRIVAL_WINDOWS } from "@/lib/bookings/constants";
import type { BookingFormState } from "@/lib/validations/booking-flow";
import { Heading, Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";

interface ScheduleStepProps {
  form: BookingFormState;
  onChange: (value: Partial<BookingFormState>) => void;
  errors: Record<string, string>;
}

export function ScheduleStep({ form, onChange, errors }: ScheduleStepProps) {
  const minDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().slice(0, 10);
  }, []);

  return (
    <MotionReveal>
      <Heading as="h2" className="text-2xl">
        Pick a date and arrival window
      </Heading>
      <div className="mt-6 space-y-4">
        <div>
          <Label htmlFor="date" required>
            Date
          </Label>
          <Input
            id="date"
            type="date"
            min={minDate}
            value={form.date ?? ""}
            onChange={(e) => onChange({ date: e.target.value })}
            invalid={Boolean(errors.date)}
          />
          {errors.date ? <p className="mt-1 text-sm text-error">{errors.date}</p> : null}
        </div>
        <div className="grid gap-3">
          {ARRIVAL_WINDOWS.map((window) => (
            <button
              key={window.id}
              type="button"
              onClick={() => onChange({ arrivalWindow: window.id })}
              className={cn(
                "rounded-xl border px-4 py-3 text-left",
                form.arrivalWindow === window.id
                  ? "border-ink bg-ink text-white"
                  : "border-border",
              )}
            >
              <p className="font-medium">{window.label}</p>
              <p
                className={cn(
                  "text-sm",
                  form.arrivalWindow === window.id ? "text-white/80" : "text-ink-muted",
                )}
              >
                {window.description}
              </p>
            </button>
          ))}
        </div>
        {errors.arrivalWindow ? (
          <p className="text-sm text-error">{errors.arrivalWindow}</p>
        ) : null}
      </div>
    </MotionReveal>
  );
}
