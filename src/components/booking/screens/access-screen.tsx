"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Pencil } from "lucide-react";
import { BookingFlowChrome } from "@/components/booking/booking-flow-chrome";
import { Label, Textarea } from "@/components/ui";
import { useBooking } from "@/components/booking/booking-provider";
import { useBookingGuard } from "@/components/booking/use-booking-guard";
import { BOOKING_SCREEN_PATHS } from "@/lib/bookings/booking-routes";
import { cn } from "@/lib/utils";

const ACCESS_CHIPS = [
  { id: "parking", label: "Parking", snippet: "Parking: " },
  { id: "buzzer", label: "Buzzer", snippet: "Buzzer: " },
  { id: "pets", label: "Pets", snippet: "Pets: " },
  { id: "special", label: "Notes", snippet: "Special notes: " },
] as const;

const MAX_ACCESS_NOTES = 500;

export function AccessScreen() {
  const router = useRouter();
  const { updateState } = useBooking();
  const { state, hydrated, blocked } = useBookingGuard("access");

  if (!hydrated || blocked) {
    return (
      <div
        data-theme="ml-dark"
        className="flex min-h-[40dvh] items-center justify-center bg-[var(--ml-dark-bg)] text-sm text-[var(--ml-dark-ink-muted)]"
      >
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
      title="How do we get in?"
      subtitle="Optional — skip if nothing special."
      ctaLabel="Continue"
      onContinue={() => {
        updateState({ step: 9 });
        router.push(BOOKING_SCREEN_PATHS.review);
      }}
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--ml-dark-mint)]/15 text-[var(--ml-dark-mint)]">
                <MapPin className="size-4" strokeWidth={2.25} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-medium tracking-wide text-[var(--ml-dark-ink-muted)] uppercase">
                  Location
                </p>
                <p className="mt-0.5 text-[15px] font-semibold leading-snug text-[var(--ml-dark-ink)]">
                  {addressLabel || "Address not set"}
                </p>
                {state.line2?.trim() ? (
                  <p className="mt-0.5 text-sm text-[var(--ml-dark-ink-muted)]">
                    Unit {state.line2.trim()}
                  </p>
                ) : null}
              </div>
            </div>
            <Link
              href={BOOKING_SCREEN_PATHS.address}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-[var(--ml-dark-mint)] transition-colors hover:bg-[var(--ml-dark-surface-2)]"
            >
              <Pencil className="size-3.5" aria-hidden />
              Edit
            </Link>
          </div>
        </div>

        <div>
          <Label htmlFor="accessNotes" className="text-[15px] font-medium text-[var(--ml-dark-ink)]">
            Entry instructions
          </Label>

          <div className="mt-2.5 flex flex-wrap gap-2">
            {ACCESS_CHIPS.map((chip) => {
              const active = notes.includes(chip.snippet.trim());
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => applyChip(chip.snippet)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-200",
                    active
                      ? "border-[var(--ml-dark-mint)] bg-[var(--ml-dark-mint)]/15 text-[var(--ml-dark-mint)]"
                      : "border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] text-[var(--ml-dark-ink)] hover:border-[var(--ml-dark-border-strong)]",
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
            placeholder="Buzzer, gate code, parking…"
            className="mt-3 min-h-[5.5rem] resize-none rounded-2xl border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] text-[15px] leading-relaxed text-[var(--ml-dark-ink)]"
            rows={3}
            maxLength={MAX_ACCESS_NOTES}
          />
          <div className="mt-1.5 flex items-center justify-between gap-3 text-xs text-[var(--ml-dark-ink-subtle)]">
            <span>You can skip this.</span>
            <span>{remaining}</span>
          </div>
        </div>
      </div>
    </BookingFlowChrome>
  );
}
