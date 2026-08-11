"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Pencil } from "lucide-react";
import { BookingFlowChrome } from "@/components/booking/booking-flow-chrome";
import { BookingMapPreview } from "@/components/booking/booking-map-preview";
import { Label, Textarea } from "@/components/ui";
import { useBooking } from "@/components/booking/booking-provider";
import { useBookingGuard } from "@/components/booking/use-booking-guard";
import { BOOKING_SCREEN_PATHS } from "@/lib/bookings/booking-routes";
import { cn } from "@/lib/utils";

const ACCESS_CHIPS = [
  { id: "parking", label: "Parking", snippet: "Parking: " },
  { id: "buzzer", label: "Buzzer", snippet: "Buzzer: " },
  { id: "pets", label: "Pets", snippet: "Pets: " },
  { id: "special", label: "Special notes", snippet: "Special notes: " },
] as const;

const MAX_ACCESS_NOTES = 500;

export function AccessScreen() {
  const router = useRouter();
  const { updateState } = useBooking();
  const { state, hydrated, blocked } = useBookingGuard("access");

  if (!hydrated || blocked) {
    return (
      <div className="flex min-h-[40dvh] items-center justify-center text-sm text-ink-muted">
        Loading…
      </div>
    );
  }

  const addressLabel =
    state.formattedAddress ||
    [state.line1, state.city, state.state, state.postalCode].filter(Boolean).join(", ");
  const notes = state.accessNotes ?? "";
  const remaining = MAX_ACCESS_NOTES - notes.length;

  const applyChip = (snippet: string) => {
    const current = state.accessNotes ?? "";
    if (current.includes(snippet.trim())) return;
    const next = current.trim()
      ? `${current.trim()}${current.trim().endsWith("\n") ? "" : "\n"}${snippet}`
      : snippet;
    updateState({ accessNotes: next.slice(0, MAX_ACCESS_NOTES) });
  };

  return (
    <BookingFlowChrome
      screenId="access"
      title="How should we get in?"
      subtitle="A few notes help your Pro arrive smoothly — optional."
      ctaLabel="Continue"
      onContinue={() => {
        updateState({ step: 9 });
        router.push(BOOKING_SCREEN_PATHS.review);
      }}
    >
      <div className="space-y-5">
        <BookingMapPreview
          latitude={state.latitude}
          longitude={state.longitude}
          label={addressLabel || "Cleaning address"}
        />

        <div className="rounded-2xl border border-[#E2E9E6] bg-white p-4 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#F1F8F5] text-accent">
                <MapPin className="size-4" strokeWidth={2.25} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                  Cleaning location
                </p>
                <p className="mt-1 text-[15px] font-semibold leading-snug text-ink">
                  {addressLabel || "Address not set"}
                </p>
                {state.line2?.trim() ? (
                  <p className="mt-0.5 text-sm text-ink-muted">Unit {state.line2.trim()}</p>
                ) : null}
              </div>
            </div>
            <Link
              href={BOOKING_SCREEN_PATHS.address}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-accent transition-colors duration-200 hover:bg-[#F1F8F5]"
            >
              <Pencil className="size-3.5" aria-hidden />
              Edit
            </Link>
          </div>
        </div>

        <div>
          <Label htmlFor="accessNotes" className="text-[15px] font-medium text-ink">
            Entry instructions
          </Label>
          <p className="mt-1 text-sm text-ink-muted">
            Buzzer, gate code, parking, or anything your Pro should know.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {ACCESS_CHIPS.map((chip) => {
              const active = notes.includes(chip.snippet.trim());
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => applyChip(chip.snippet)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-200",
                    active
                      ? "border-accent bg-[#F1F8F5] text-accent"
                      : "border-[#E2E9E6] bg-white text-ink hover:border-[#C5D2CD] hover:bg-[#F1F8F5]",
                  )}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          <Textarea
            id="accessNotes"
            value={notes}
            onChange={(e) =>
              updateState({ accessNotes: e.target.value.slice(0, MAX_ACCESS_NOTES) })
            }
            placeholder="e.g. Park in visitor spot B2. Buzzer #304. Friendly dog indoors."
            className="mt-3 min-h-[120px] resize-y rounded-2xl border-[#E2E9E6] text-[15px] leading-relaxed"
            rows={5}
            maxLength={MAX_ACCESS_NOTES}
          />
          <div className="mt-2 flex items-center justify-between gap-3 text-sm text-ink-subtle">
            <span>You can skip this if nothing special.</span>
            <span className={cn(remaining < 40 && "text-ink-muted")}>{remaining}</span>
          </div>
        </div>
      </div>
    </BookingFlowChrome>
  );
}
