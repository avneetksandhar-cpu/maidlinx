"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { BookingFlowChrome } from "@/components/booking/booking-flow-chrome";
import { ExtrasSelector } from "@/components/booking/extras-selector";
import { useBooking } from "@/components/booking/booking-provider";
import { useBookingGuard } from "@/components/booking/use-booking-guard";
import { BOOKING_SCREEN_PATHS } from "@/lib/bookings/booking-routes";
import { buildQuoteInput } from "@/lib/bookings/booking-helpers";
import { useBookingPricing } from "@/hooks/use-booking-pricing";
import { formatCurrency } from "@/lib/utils";
import { trackBookingEvent } from "@/lib/analytics/booking";
import { Button } from "@/components/ui";

export function ExtrasScreen() {
  const router = useRouter();
  const { updateState } = useBooking();
  const { state, hydrated, blocked } = useBookingGuard("extras");

  const quoteInput = useMemo(
    () => buildQuoteInput(state, { requireAddress: true }),
    [state],
  );
  const { pricing, loading } = useBookingPricing({
    quoteInput,
    enabled: Boolean(quoteInput),
  });

  if (!hydrated || blocked) {
    return (
      <div className="flex min-h-[40dvh] items-center justify-center text-sm text-ink-muted">
        Loading…
      </div>
    );
  }

  const totalLabel =
    pricing && !pricing.quoteOnly
      ? formatCurrency(pricing.totalCents, pricing.currency)
      : null;

  return (
    <BookingFlowChrome
      screenId="extras"
      title="Anything extra?"
      subtitle="Optional add-ons — skip if you don’t need any."
      ctaLabel={totalLabel ? `Continue · ${totalLabel}` : "Continue"}
      footerHint={
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-ink-muted">
            {(state.extras?.length ?? 0) === 0
              ? "No extras"
              : `${state.extras!.length} extra${state.extras!.length === 1 ? "" : "s"}`}
          </span>
          <span className="font-semibold tabular-nums text-ink">
            {totalLabel ? (loading ? "Updating…" : totalLabel) : "—"}
          </span>
        </div>
      }
      onContinue={() => {
        updateState({ step: 6 });
        router.push(BOOKING_SCREEN_PATHS.schedule);
      }}
    >
      <div className="space-y-4">
        <ExtrasSelector
          hideLegend
          value={state.extras ?? []}
          onChange={(extras) => {
            const added = extras.find((id) => !(state.extras ?? []).includes(id));
            if (added) trackBookingEvent("addon_selected", { addon: added });
            updateState({ extras });
          }}
        />
        <Button
          type="button"
          variant="secondary"
          className="w-full rounded-xl"
          onClick={() => {
            updateState({ extras: [], step: 6 });
            router.push(BOOKING_SCREEN_PATHS.schedule);
          }}
        >
          No extras
        </Button>
      </div>
    </BookingFlowChrome>
  );
}
