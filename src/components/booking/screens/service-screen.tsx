"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import { BookingFlowChrome } from "@/components/booking/booking-flow-chrome";
import { BedroomSelector, BathroomSelector } from "@/components/booking/bedroom-selector";
import { ExtrasSelector } from "@/components/booking/extras-selector";
import { RecurringFrequencyPicker } from "@/components/booking/recurring-frequency-picker";
import { useBooking } from "@/components/booking/booking-provider";
import { useBookingGuard } from "@/components/booking/use-booking-guard";
import { useReturnToReview } from "@/components/booking/use-return-to-review";
import {
  BOOKING_SCREEN_PATHS,
  getNextScreen,
  isCleanPanelComplete,
} from "@/lib/bookings/booking-routes";
import { getServiceBySlug } from "@/config/services";
import {
  getServiceTiersForProperty,
  type ServiceTier,
} from "@/config/service-tiers";
import { resolveServiceAreaCurrency } from "@/lib/bookings/market-currency";
import { buildQuoteInput } from "@/lib/bookings/booking-helpers";
import { useBookingPricing } from "@/hooks/use-booking-pricing";
import { trackBookingEvent } from "@/lib/analytics/booking";
import { formatCurrency, cn } from "@/lib/utils";
import type { RecurringFrequencyId } from "@/lib/recurring/frequencies";

const STANDARD_INCLUDED = [
  "Kitchen surfaces, sink, and appliance exteriors",
  "Bathrooms — sinks, toilets, showers/tubs, mirrors",
  "Living areas and bedrooms — dust, floors, tidy surfaces",
  "Extras (fridge, oven, laundry, windows) priced separately",
] as const;

const TIER_BLURBS: Record<string, string> = {
  standard: "Routine upkeep for your home.",
  deep: "A more detailed, top-to-bottom clean.",
};

export function ServiceScreen() {
  const router = useRouter();
  const { updateState } = useBooking();
  const { state, hydrated, blocked } = useBookingGuard("service");
  const { fromReview, continuePath, reviewPath } = useReturnToReview();
  const [includedOpen, setIncludedOpen] = useState(false);
  const currency = resolveServiceAreaCurrency(state) ?? "USD";

  const propertyType = state.propertyType ?? "house";

  useEffect(() => {
    if (!hydrated || blocked) return;
    const patch: Record<string, unknown> = {};
    if (!state.propertyType) {
      patch.propertyType = "house";
      patch.serviceAnswers = {
        ...(state.serviceAnswers ?? {}),
        propertyType: "house",
        bookingCategory: "home",
      };
    }
    if (state.bedrooms == null) patch.bedrooms = 2;
    if (state.bathrooms == null) patch.bathrooms = 1;
    if (state.squareFootage == null) patch.squareFootage = 1500;
    if (state.extras == null) patch.extras = [];
    if (!state.serviceType) {
      patch.serviceTierId = "standard";
      patch.serviceType = "standard";
      patch.serviceSlug = "residential";
      patch.serviceTile = "home";
    }
    if (Object.keys(patch).length > 0) updateState(patch);
  }, [hydrated, blocked]); // eslint-disable-line react-hooks/exhaustive-deps -- seed once

  const tiers = useMemo(() => {
    const all = getServiceTiersForProperty(propertyType);
    const preferred = ["standard", "deep"];
    const sorted = [...all].sort((a, b) => {
      const ai = preferred.indexOf(a.id);
      const bi = preferred.indexOf(b.id);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
    return sorted.filter((t) => t.id === "standard" || t.id === "deep" || sorted.length <= 2);
  }, [propertyType]);

  const quoteInput = useMemo(
    () => buildQuoteInput(state, { requireAddress: true, allowPreview: true }),
    [state],
  );
  const { pricing, loading: priceLoading } = useBookingPricing({
    quoteInput,
    enabled: Boolean(quoteInput && state.serviceType),
  });

  const selectTier = (tier: ServiceTier) => {
    const service = getServiceBySlug(tier.serviceSlug);
    trackBookingEvent("service_selected", {
      tierId: tier.id,
      serviceType: tier.serviceType,
    });
    updateState({
      propertyType,
      serviceTierId: tier.id,
      serviceType: tier.serviceType,
      serviceSlug: service?.slug ?? tier.serviceSlug,
      serviceTile: "home",
      bedrooms: state.bedrooms ?? 2,
      bathrooms: state.bathrooms ?? 2,
      squareFootage: state.squareFootage ?? 1500,
      extras: state.extras ?? [],
      serviceAnswers: {
        ...(state.serviceAnswers ?? {}),
        propertyType,
        bookingCategory: "home",
      },
      step: 3,
    });
  };

  const handleContinue = () => {
    if (!state.propertyType) {
      updateState({
        propertyType: "house",
        bedrooms: state.bedrooms ?? 2,
        bathrooms: state.bathrooms ?? 2,
        squareFootage: state.squareFootage ?? 1500,
        extras: state.extras ?? [],
      });
    }
    if (!state.serviceType) return;
    if (state.extras == null) updateState({ extras: [] });

    const merged = {
      ...state,
      propertyType: state.propertyType ?? ("house" as const),
      bedrooms: state.bedrooms ?? 2,
      bathrooms: state.bathrooms ?? 2,
      squareFootage: state.squareFootage ?? 1500,
      extras: state.extras ?? [],
    };

    if (!isCleanPanelComplete(merged)) return;

    router.push(
      continuePath(BOOKING_SCREEN_PATHS[getNextScreen("service", merged)]),
    );
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

  const totalLabel =
    pricing && !pricing.quoteOnly
      ? formatCurrency(pricing.totalCents, pricing.currency)
      : null;

  const canContinue = Boolean(
    state.serviceType &&
      (state.bedrooms != null || state.bedrooms === 0) &&
      state.bathrooms != null &&
      (state.squareFootage ?? 1500) >= 200,
  );

  return (
    <BookingFlowChrome
      screenId="service"
      title="Choose your clean"
      subtitle="Pick a service, home size, and any extras."
      ctaLabel="Choose a time"
      ctaDisabled={!canContinue}
      backHref={fromReview ? reviewPath : BOOKING_SCREEN_PATHS.address}
      hideDefaultTotal
      footerHint={
        <div className="flex items-center justify-between gap-3 text-[16px]">
          <span className="text-[var(--ml-book-ink-muted)]">Estimated total</span>
          <span className="font-bold tabular-nums text-white">
            {priceLoading ? "Updating…" : totalLabel ?? "—"}
          </span>
        </div>
      }
      onContinue={handleContinue}
    >
      <div className="space-y-6">
        <fieldset>
          <legend className="sr-only">Service</legend>
          <div className="grid gap-2.5">
            {tiers.map((tier) => {
              const selected =
                state.serviceTierId === tier.id || state.serviceType === tier.serviceType;
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => selectTier(tier)}
                  aria-pressed={selected}
                  data-selected={selected}
                  className={cn(
                    "booking-select-card flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition-all",
                    selected
                      ? "border-[var(--ml-book-primary,#04CED2)] bg-[var(--ml-book-selected,#163556)]"
                      : "border-[var(--ml-book-border-strong)] bg-[var(--ml-book-surface,#102B49)]",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-bold text-white">{tier.label}</span>
                    <span className="mt-0.5 block text-[15px] text-[var(--ml-book-ink-muted)]">
                      {TIER_BLURBS[tier.id] ?? tier.description}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      selected
                        ? "border-[var(--ml-book-primary,#04CED2)] bg-[var(--ml-book-primary,#04CED2)] text-[#01193D]"
                        : "border-[var(--ml-book-border-strong)] bg-transparent",
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

        <button
          type="button"
          onClick={() => setIncludedOpen((o) => !o)}
          aria-expanded={includedOpen}
          className="inline-flex items-center gap-1 text-[15px] font-semibold text-[var(--ml-book-primary,#04CED2)]"
        >
          What&apos;s included?
          <ChevronDown
            className={cn("size-4 transition-transform", includedOpen && "rotate-180")}
            aria-hidden
          />
        </button>
        {includedOpen ? (
          <ul className="space-y-2 rounded-2xl border border-[var(--ml-book-border)] bg-[var(--ml-book-surface,#102B49)] px-4 py-3 text-[15px] text-white">
            {STANDARD_INCLUDED.map((item) => (
              <li key={item} className="flex gap-2">
                <Check
                  className="mt-0.5 size-4 shrink-0 text-[var(--ml-book-primary,#04CED2)]"
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div>
          <p className="mb-3 text-[15px] font-semibold text-white">Home details</p>
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
          <p className="mt-2 text-xs text-[var(--ml-book-ink-subtle)]">
            Used for live pricing · {currency}
          </p>
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

        <RecurringFrequencyPicker
          variant="toggle"
          value={(state.recurringFrequency as RecurringFrequencyId) ?? "one_time"}
          onChange={(recurringFrequency) => updateState({ recurringFrequency })}
        />
      </div>
    </BookingFlowChrome>
  );
}
