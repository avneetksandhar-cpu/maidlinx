"use client";

import { MapPin } from "lucide-react";
import { Input, Label, Textarea } from "@/components/ui";
import type { BookingState } from "@/lib/bookings/booking-state";
import { cn } from "@/lib/utils";

interface ConfirmPropertyStepProps {
  state: BookingState;
  onChange: (value: Partial<BookingState>) => void;
  errors?: Record<string, string>;
}

function staticMapUrl(lat?: number, lng?: number): string | null {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  if (!key || lat == null || lng == null) return null;
  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom: "15",
    size: "640x320",
    scale: "2",
    maptype: "roadmap",
    markers: `color:0x0d9488|${lat},${lng}`,
    key,
    style: "feature:poi|visibility:off",
  });
  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}

export function ConfirmPropertyStep({ state, onChange, errors = {} }: ConfirmPropertyStepProps) {
  const mapUrl = staticMapUrl(state.latitude, state.longitude);
  const summary =
    state.formattedAddress ||
    [state.line1, state.city, state.state, state.postalCode].filter(Boolean).join(", ");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="booking-step-title">Confirm your property</h2>
        <p className="booking-step-subtitle">Pin the spot and add entry details for your Pro.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface-muted">
        {mapUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- static Maps URL with API key
          <img
            src={mapUrl}
            alt={`Map showing ${summary}`}
            className="h-44 w-full object-cover sm:h-56"
          />
        ) : (
          <div className="flex h-44 items-center justify-center bg-navy/5 sm:h-56">
            <div className="flex flex-col items-center gap-2 text-ink-muted">
              <MapPin className="size-8 text-accent" aria-hidden />
              <p className="text-sm">Map preview unavailable</p>
            </div>
          </div>
        )}
        <div className="flex items-start gap-3 px-4 py-3">
          <MapPin className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">{state.line1}</p>
            <p className="text-sm text-ink-muted">
              {[state.city, state.state, state.postalCode].filter(Boolean).join(", ")}
            </p>
          </div>
        </div>
      </div>

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
          onChange={(e) => onChange({ accessNotes: e.target.value })}
          placeholder="Buzzer code, parking spot, pet notes…"
          rows={3}
          className={cn("mt-2 rounded-xl", errors.accessNotes && "border-error")}
        />
        {errors.accessNotes ? (
          <p className="mt-2 text-sm text-error">{errors.accessNotes}</p>
        ) : null}
      </div>
    </div>
  );
}
