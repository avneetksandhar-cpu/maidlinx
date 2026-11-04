"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, Plus } from "lucide-react";
import { BookingFlowChrome } from "@/components/booking/booking-flow-chrome";
import { DateStrip } from "@/components/booking/date-strip";
import { useBooking } from "@/components/booking/booking-provider";
import { useBookingGuard } from "@/components/booking/use-booking-guard";
import { useReturnToReview } from "@/components/booking/use-return-to-review";
import {
  BOOKING_SCREEN_PATHS,
  getNextScreen,
  isScheduleComplete,
} from "@/lib/bookings/booking-routes";
import {
  formatArrivesWindowLabel,
  formatBookingDateLabel,
} from "@/lib/bookings/arrival-labels";
import { ARRIVAL_WINDOWS, type ArrivalWindowId } from "@/lib/bookings/constants";
import { resolveSchedulePreset, formatDurationLabel } from "@/lib/bookings/schedule-presets";
import { suggestArrivalWindows } from "@/lib/availability/windows";
import { buildQuoteInput } from "@/lib/bookings/booking-helpers";
import { useBookingPricing } from "@/hooks/use-booking-pricing";
import { trackBookingEvent } from "@/lib/analytics/booking";
import { formatCurrency, cn } from "@/lib/utils";
import { Textarea } from "@/components/ui";

export function DateScreen() {
  const router = useRouter();
  const { updateState } = useBooking();
  const { state, hydrated, blocked } = useBookingGuard("date");
  const { fromReview, continuePath, reviewPath } = useReturnToReview();
  const [pickAnotherDay, setPickAnotherDay] = useState(false);
  const [showInstructions, setShowInstructions] = useState(
    Boolean(state.accessNotes?.trim()),
  );

  const quoteInput = useMemo(
    () => buildQuoteInput(state, { requireAddress: true }),
    [state],
  );
  const { pricing, loading: priceLoading } = useBookingPricing({
    quoteInput,
    enabled: Boolean(quoteInput),
  });

  const durationMinutes =
    pricing && !pricing.quoteOnly
      ? (pricing.estimatedDurationMinutes ?? 120)
      : 120;

  // Seed earliest opening from real preset resolution (never invent dates beyond resolver).
  useEffect(() => {
    if (!hydrated || blocked) return;
    if (state.date && state.arrivalWindow && state.schedulePreset) return;
    const resolved = resolveSchedulePreset(state.schedulePreset ?? "asap", {
      date: state.date,
      arrivalWindow: state.arrivalWindow as ArrivalWindowId | undefined,
    });
    updateState({
      schedulePreset: state.schedulePreset ?? "asap",
      date: resolved.date,
      arrivalWindow: resolved.arrivalWindow,
    });
  }, [hydrated, blocked]); // eslint-disable-line react-hooks/exhaustive-deps -- seed once

  const windows = useMemo(() => {
    if (!state.date) return [];
    return suggestArrivalWindows({
      marketId: state.marketId || "SOUTH_FLORIDA",
      date: state.date,
      durationMinutes,
    });
  }, [state.date, state.marketId, durationMinutes]);

  const availableWindows = windows.filter((w) => w.available);
  const noOpenings = state.date != null && availableWindows.length === 0;

  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const totalLabel =
    pricing && !pricing.quoteOnly
      ? formatCurrency(pricing.totalCents, pricing.currency)
      : null;

  const handleContinue = () => {
    if (!isScheduleComplete(state) || noOpenings) return;
    trackBookingEvent("date_selected", {
      preset: state.schedulePreset,
      date: state.date,
      window: state.arrivalWindow,
    });
    updateState({ step: 7 });
    router.push(continuePath(BOOKING_SCREEN_PATHS[getNextScreen("date", state)]));
  };

  if (!hydrated || blocked) {
    return (
      <div
        data-theme="ml-book"
        className="flex min-h-[40dvh] items-center justify-center bg-white text-sm text-[var(--ml-book-ink-muted)]"
      >
        Loading…
      </div>
    );
  }

  return (
    <BookingFlowChrome
      screenId="date"
      title="When should we come?"
      subtitle="We only offer times a cleaner can fulfill — never invented slots."
      ctaLabel="Review booking"
      ctaDisabled={!isScheduleComplete(state) || noOpenings}
      backHref={fromReview ? reviewPath : BOOKING_SCREEN_PATHS.service}
      footerHint={
        totalLabel ? (
          <div className="flex items-center justify-between gap-3 text-[15px]">
            <span className="text-[var(--ml-book-ink-muted)]">Estimated total</span>
            <span className="font-bold tabular-nums text-[var(--ml-book-ink,#01193D)]">
              {priceLoading ? "Updating…" : totalLabel}
            </span>
          </div>
        ) : null
      }
      onContinue={handleContinue}
    >
      <div className="space-y-5">
        <div>
          <p className="text-sm font-semibold text-[var(--ml-book-ink-muted)]">
            Earliest opening
          </p>
          <p className="mt-1 text-xl font-bold text-[var(--ml-book-ink,#01193D)]">
            {formatBookingDateLabel(state.date)}
          </p>
        </div>

        {noOpenings ? (
          <div
            className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3.5 text-sm text-amber-950"
            role="status"
          >
            <p className="font-semibold">No openings on this day</p>
            <p className="mt-1">
              Your quote is saved. Choose another day below — we never invent available
              slots.
            </p>
          </div>
        ) : (
          <fieldset>
            <legend className="sr-only">Arrival window</legend>
            <div className="grid gap-2.5">
              {(availableWindows.length > 0
                ? availableWindows
                : ARRIVAL_WINDOWS.map((w) => ({
                    id: w.id as ArrivalWindowId,
                    available: true,
                  }))
              ).map((window) => {
                const id = window.id as ArrivalWindowId;
                const selected = state.arrivalWindow === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      updateState({
                        arrivalWindow: id,
                        schedulePreset:
                          state.schedulePreset === "date" ? "date" : state.schedulePreset ?? "asap",
                      })
                    }
                    aria-pressed={selected}
                    data-selected={selected}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left transition-all",
                      selected
                        ? "border-[var(--ml-book-primary,#04CED2)] bg-[var(--ml-book-selected,#E6FAFA)]"
                        : "border-[var(--ml-book-border)] bg-white",
                    )}
                  >
                    <span className="min-w-0 flex-1 text-[15px] font-semibold text-[var(--ml-book-ink,#01193D)]">
                      {formatArrivesWindowLabel(id)}
                    </span>
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
                        selected
                          ? "border-[var(--ml-book-primary,#04CED2)] bg-[var(--ml-book-primary,#04CED2)] text-[var(--ml-book-ink,#01193D)]"
                          : "border-[var(--ml-book-border-strong)]",
                      )}
                      aria-hidden
                    >
                      {selected ? <Check className="size-3.5" strokeWidth={3} /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {!pickAnotherDay ? (
          <button
            type="button"
            onClick={() => {
              setPickAnotherDay(true);
              updateState({ schedulePreset: "date" });
            }}
            className="text-sm font-semibold text-[var(--ml-book-primary,#04CED2)]"
          >
            Choose another day
          </button>
        ) : (
          <div>
            <p className="mb-3 text-sm font-semibold text-[var(--ml-book-ink,#01193D)]">
              Choose another day
            </p>
            <DateStrip
              value={state.date}
              minDate={minDate}
              onChange={(date) =>
                updateState({
                  date,
                  schedulePreset: "date",
                  // Clear window so customer re-picks for the new day if needed.
                  arrivalWindow: state.arrivalWindow,
                })
              }
            />
          </div>
        )}

        {pricing && !pricing.quoteOnly ? (
          <p className="text-sm text-[var(--ml-book-ink-muted)]">
            Estimated cleaning time: {formatDurationLabel(durationMinutes).replace(/^~/, "")}
          </p>
        ) : null}

        {!showInstructions ? (
          <button
            type="button"
            onClick={() => setShowInstructions(true)}
            className="flex w-full items-center gap-3 rounded-2xl border border-[var(--ml-book-border)] bg-white px-4 py-3.5 text-left transition-colors hover:border-[var(--ml-book-primary,#04CED2)]"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--ml-book-selected,#E6FAFA)] text-[var(--ml-book-primary,#04CED2)]">
              <Plus className="size-4" strokeWidth={2.5} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-[var(--ml-book-ink,#01193D)]">
                Add arrival instructions
              </span>
              <span className="mt-0.5 block text-sm text-[var(--ml-book-ink-muted)]">
                Front desk, gate or parking
              </span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-[var(--ml-book-ink-subtle)]" aria-hidden />
          </button>
        ) : (
          <div>
            <label
              htmlFor="arrival-instructions"
              className="mb-2 block text-sm font-semibold text-[var(--ml-book-ink,#01193D)]"
            >
              Arrival instructions
            </label>
            <Textarea
              id="arrival-instructions"
              value={state.accessNotes ?? ""}
              onChange={(e) =>
                updateState({ accessNotes: e.target.value.slice(0, 500) })
              }
              placeholder="Front desk, gate code, parking…"
              rows={3}
              className="rounded-xl border-[var(--ml-book-border)]"
            />
          </div>
        )}

      </div>
    </BookingFlowChrome>
  );
}
