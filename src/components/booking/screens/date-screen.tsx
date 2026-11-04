"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { BookingFlowChrome } from "@/components/booking/booking-flow-chrome";
import { DateStrip } from "@/components/booking/date-strip";
import { useBooking } from "@/components/booking/booking-provider";
import { useBookingGuard } from "@/components/booking/use-booking-guard";
import { useReturnToReview } from "@/components/booking/use-return-to-review";
import { BOOKING_SCREEN_PATHS } from "@/lib/bookings/booking-routes";
import { formatWindowRangeShort } from "@/lib/bookings/arrival-labels";
import { ARRIVAL_WINDOWS, type ArrivalWindowId } from "@/lib/bookings/constants";
import { resolveSchedulePreset, formatDurationLabel } from "@/lib/bookings/schedule-presets";
import { suggestArrivalWindows } from "@/lib/availability/windows";
import { buildQuoteInput } from "@/lib/bookings/booking-helpers";
import { useBookingPricing } from "@/hooks/use-booking-pricing";
import { trackBookingEvent } from "@/lib/analytics/booking";

function aboutHours(minutes: number): string | null {
  if (!Number.isFinite(minutes) || minutes < 60) return null;
  const hours = Math.round(minutes / 30) / 2;
  if (hours < 1) return null;
  return hours === Math.floor(hours)
    ? `${hours} hour${hours === 1 ? "" : "s"}`
    : `${hours} hours`;
}

/**
 * Panel 4 — Choose an arrival. Date strip + windows; tap window → Review.
 */
export function DateScreen() {
  const router = useRouter();
  const { updateState } = useBooking();
  const { state, hydrated, blocked } = useBookingGuard("date");
  const { fromReview, continuePath, reviewPath } = useReturnToReview();

  const quoteInput = useMemo(
    () => buildQuoteInput(state, { requireAddress: true }),
    [state],
  );
  const { pricing } = useBookingPricing({
    quoteInput,
    enabled: Boolean(quoteInput),
  });

  const durationMinutes =
    pricing && !pricing.quoteOnly ? (pricing.estimatedDurationMinutes ?? 0) : 0;
  const durationReliable =
    pricing && !pricing.quoteOnly && Boolean(pricing.estimatedDurationMinutes);
  const durationHours = durationReliable ? aboutHours(durationMinutes) : null;

  useEffect(() => {
    if (!hydrated || blocked) return;
    if (state.date && state.schedulePreset) return;
    const resolved = resolveSchedulePreset(state.schedulePreset ?? "asap", {
      date: state.date,
      arrivalWindow: state.arrivalWindow as ArrivalWindowId | undefined,
    });
    updateState({
      schedulePreset: state.schedulePreset ?? "asap",
      date: resolved.date,
      // Don't auto-select window — customer taps one to advance.
      arrivalWindow: state.arrivalWindow,
    });
  }, [hydrated, blocked]); // eslint-disable-line react-hooks/exhaustive-deps

  const windows = useMemo(() => {
    if (!state.date) return [];
    return suggestArrivalWindows({
      marketId: state.marketId || "SOUTH_FLORIDA",
      date: state.date,
      durationMinutes: durationMinutes || 120,
    });
  }, [state.date, state.marketId, durationMinutes]);

  const availableWindows = windows.filter((w) => w.available);
  const list =
    availableWindows.length > 0
      ? availableWindows
      : ARRIVAL_WINDOWS.map((w) => ({
          id: w.id as ArrivalWindowId,
          available: true,
        }));

  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const selectWindow = (id: ArrivalWindowId) => {
    updateState({
      arrivalWindow: id,
      schedulePreset: state.schedulePreset ?? "asap",
      step: 7,
    });
    trackBookingEvent("date_selected", {
      preset: state.schedulePreset ?? "asap",
      date: state.date,
      window: id,
    });
    router.push(continuePath(BOOKING_SCREEN_PATHS.review));
  };

  if (!hydrated || blocked) {
    return (
      <div
        data-theme="ml-book"
        className="flex min-h-[40dvh] items-center justify-center bg-[var(--ml-book-bg,#01193D)] text-sm text-[var(--ml-book-ink-muted)]"
      >
        Loading…
      </div>
    );
  }

  return (
    <BookingFlowChrome
      screenId="date"
      title="Choose an arrival"
      hideCta
      hideDefaultTotal
      backHref={fromReview ? reviewPath : BOOKING_SCREEN_PATHS.details}
    >
      <div className="space-y-6">
        <DateStrip
          value={state.date}
          minDate={minDate}
          days={14}
          onChange={(date) =>
            updateState({
              date,
              schedulePreset: "date",
              arrivalWindow: undefined,
            })
          }
        />

        {list.length === 0 ? (
          <div
            className="rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3.5 text-[15px] text-amber-100"
            role="status"
          >
            <p className="font-semibold">No openings on this day</p>
            <p className="mt-1 text-amber-100/85">
              Pick another day above — we never invent available slots.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/15">
            {list.map((window, index) => {
              const id = window.id as ArrivalWindowId;
              const range = formatWindowRangeShort(id);
              const earliest = index === 0;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => selectWindow(id)}
                  className="flex w-full items-center gap-3 py-4 text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17px] font-semibold text-white">{range}</span>
                    {earliest ? (
                      <span className="mt-0.5 block text-[14px] font-medium text-[#04CED2]">
                        Earliest available
                      </span>
                    ) : null}
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-[#04CED2]" aria-hidden />
                </button>
              );
            })}
          </div>
        )}

        <p className="text-[15px] text-white/65">Tap a window to review your booking.</p>

        {durationHours ? (
          <p className="border-t border-white/15 pt-4 text-[14px] text-white/55">
            Estimated cleaning time · {durationHours}
            {durationMinutes
              ? ` (${formatDurationLabel(durationMinutes).replace(/^~/, "")})`
              : ""}
          </p>
        ) : null}
      </div>
    </BookingFlowChrome>
  );
}
