"use client";

import { Input, Label, Textarea } from "@/components/ui";
import { BookingMapPreview } from "@/components/booking/booking-map-preview";
import type { BookingState } from "@/lib/bookings/booking-state";
import { cn } from "@/lib/utils";

interface ConfirmPropertyStepProps {
  state: BookingState;
  onChange: (value: Partial<BookingState>) => void;
  errors?: Record<string, string>;
}

export function ConfirmPropertyStep({ state, onChange, errors = {} }: ConfirmPropertyStepProps) {
  const summary =
    state.formattedAddress ||
    [state.line1, state.city, state.state, state.postalCode].filter(Boolean).join(", ");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="booking-step-title">Confirm your property</h2>
        <p className="booking-step-subtitle">Pin the spot and add entry details for your Pro.</p>
      </div>

      <BookingMapPreview
        latitude={state.latitude}
        longitude={state.longitude}
        label={summary || "Cleaning address"}
        compact
      />

      <div>
        <Label htmlFor="line2" className="text-sm text-ink-muted">
          Unit / suite (optional)
        </Label>
        <Input
          id="line2"
          value={state.line2 ?? ""}
          onChange={(e) => onChange({ line2: e.target.value })}
          placeholder="Apt, suite, floor…"
          className="booking-input-lg mt-2 rounded-xl"
          invalid={Boolean(errors.line2)}
        />
      </div>

      <div>
        <Label htmlFor="accessNotes" className="text-sm text-ink-muted">
          Entry, parking, or gate notes
        </Label>
        <Textarea
          id="accessNotes"
          value={state.accessNotes ?? ""}
          onChange={(e) => onChange({ accessNotes: e.target.value.slice(0, 500) })}
          placeholder="Buzzer code, parking spot, pet notes…"
          rows={4}
          maxLength={500}
          className={cn("mt-2 min-h-[120px] rounded-xl", errors.accessNotes && "border-error")}
        />
        {errors.accessNotes ? (
          <p className="mt-2 text-sm text-error">{errors.accessNotes}</p>
        ) : null}
      </div>
    </div>
  );
}
