"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Box, Flame, Refrigerator, Sparkles, SprayCan } from "lucide-react";
import { BookingFlowChrome } from "@/components/booking/booking-flow-chrome";
import { BedroomSelector, BathroomSelector } from "@/components/booking/bedroom-selector";
import { ExtrasSelector } from "@/components/booking/extras-selector";
import { useBooking } from "@/components/booking/booking-provider";
import { useBookingGuard } from "@/components/booking/use-booking-guard";
import { useReturnToReview } from "@/components/booking/use-return-to-review";
import { useFinishBookingTitle } from "@/components/booking/use-finish-booking-title";
import {
  BOOKING_SCREEN_PATHS,
  getNextScreen,
  isCleanPanelComplete,
} from "@/lib/bookings/booking-routes";
import { buildQuoteInput } from "@/lib/bookings/booking-helpers";
import { useBookingPricing } from "@/hooks/use-booking-pricing";
import { getBookingServiceLabel } from "@/lib/bookings/constants";
import { trackBookingEvent } from "@/lib/analytics/booking";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

function serviceIcon(serviceType?: string) {
  if (serviceType === "deep") return Sparkles;
  if (serviceType === "move_out" || serviceType === "move_in") return Box;
  return SprayCan;
}

/**
 * Panel 3 — Make it yours. Selected service + beds/baths + extras + sticky total.
 */
export function DetailsScreen() {
  const router = useRouter();
  const { updateState } = useBooking();
  const { state, hydrated, blocked } = useBookingGuard("details");
  const { fromReview, continuePath, reviewPath } = useReturnToReview();
  const title = useFinishBookingTitle("Make it yours");

  useEffect(() => {
    if (!hydrated || blocked) return;
    const patch: Record<string, unknown> = {};
    if (!state.propertyType) {
      patch.propertyType = state.serviceType === "move_out" ? "move" : "condo";
    }
    if (state.bedrooms == null) patch.bedrooms = 2;
    if (state.bathrooms == null) patch.bathrooms = 1;
    if (state.squareFootage == null) patch.squareFootage = 1200;
    if (state.extras == null) patch.extras = [];
    if (Object.keys(patch).length > 0) updateState(patch);
  }, [hydrated, blocked]); // eslint-disable-line react-hooks/exhaustive-deps

  const quoteInput = useMemo(
    () => buildQuoteInput(state, { requireAddress: true, allowPreview: true }),
    [state],
  );
  const { pricing, loading: priceLoading } = useBookingPricing({
    quoteInput,
    enabled: Boolean(quoteInput && state.serviceType),
  });

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

  const Icon = serviceIcon(state.serviceType);
  const serviceLabel =
    state.serviceType === "standard"
      ? "Standard clean"
      : state.serviceType === "deep"
        ? "Deep clean"
        : state.serviceType === "move_out"
          ? "Move-out clean"
          : state.serviceType
            ? getBookingServiceLabel(state.serviceType)
            : "Your clean";

  const totalLabel =
    pricing && !pricing.quoteOnly
      ? formatCurrency(pricing.totalCents, pricing.currency)
      : null;

  const canContinue = Boolean(
    state.serviceType &&
      (state.bedrooms != null || state.bedrooms === 0) &&
      state.bathrooms != null,
  );

  const handleContinue = () => {
    if (!canContinue) return;
    const merged = {
      ...state,
      propertyType: state.propertyType ?? ("condo" as const),
      bedrooms: state.bedrooms ?? 2,
      bathrooms: state.bathrooms ?? 1,
      squareFootage: state.squareFootage ?? 1200,
      extras: state.extras ?? [],
    };
    updateState({
      propertyType: merged.propertyType,
      bedrooms: merged.bedrooms,
      bathrooms: merged.bathrooms,
      squareFootage: merged.squareFootage,
      extras: merged.extras,
      step: 5,
    });
    if (!isCleanPanelComplete(merged)) return;
    router.push(continuePath(BOOKING_SCREEN_PATHS[getNextScreen("details", merged)]));
  };

  return (
    <BookingFlowChrome
      screenId="details"
      title={title}
      ctaLabel="Choose a time"
      ctaDisabled={!canContinue}
      hideDefaultTotal
      backHref={fromReview ? reviewPath : BOOKING_SCREEN_PATHS.service}
      footerHint={
        <div className="flex items-center justify-between gap-3 text-[16px]">
          <span className="text-white/70">Estimated total</span>
          <span className="text-xl font-bold tabular-nums text-white">
            {priceLoading ? "…" : totalLabel ?? "—"}
          </span>
        </div>
      }
      onContinue={handleContinue}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-white/15 pb-4">
          <span className="flex size-10 items-center justify-center text-[#04CED2]">
            <Icon className="size-6" strokeWidth={1.75} aria-hidden />
          </span>
          <p className="min-w-0 flex-1 text-[17px] font-semibold text-white">{serviceLabel}</p>
          <Link
            href={BOOKING_SCREEN_PATHS.service + (fromReview ? "?from=review" : "")}
            className="text-[15px] font-semibold text-[#04CED2]"
          >
            Edit
          </Link>
        </div>

        <div>
          <p className="mb-3 text-[15px] font-semibold text-white">Your home</p>
          <div className="grid grid-cols-2 gap-3">
            <BedroomSelector
              value={state.bedrooms ?? 2}
              onChange={(bedrooms) => updateState({ bedrooms })}
              compact
            />
            <BathroomSelector
              value={state.bathrooms ?? 1}
              onChange={(bathrooms) => updateState({ bathrooms })}
              compact
            />
          </div>
        </div>

        <div>
          <p className="mb-3 text-[15px] font-semibold text-white">Extras</p>
          <ExtrasSelector
            hideLegend
            value={state.extras ?? []}
            onChange={(extras) => {
              const added = extras.find((id) => !(state.extras ?? []).includes(id));
              if (added) trackBookingEvent("addon_selected", { addon: added });
              updateState({ extras });
            }}
          />
        </div>

        {/* Quiet hint for design icons used in mock — oven/fridge stay in ExtrasSelector */}
        <p className="sr-only">
          <Flame aria-hidden />
          <Refrigerator aria-hidden />
        </p>
      </div>
    </BookingFlowChrome>
  );
}
