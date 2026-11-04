"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { AddressAutocomplete } from "@/components/booking/address-autocomplete";
import { BookingFlowChrome } from "@/components/booking/booking-flow-chrome";
import { ManualAddressForm } from "@/components/booking/manual-address-form";
import { ReturningCustomerBanner } from "@/components/booking/returning-customer-banner";
import { SavedPlaceChips } from "@/components/booking/saved-place-chips";
import { useBooking } from "@/components/booking/booking-provider";
import { useBookingGuard } from "@/components/booking/use-booking-guard";
import { useReturnToReview } from "@/components/booking/use-return-to-review";
import {
  BOOKING_SCREEN_PATHS,
  getNextScreen,
  isAddressComplete,
} from "@/lib/bookings/booking-routes";
import { buildAddressStatePatch } from "@/lib/bookings/booking-helpers";
import { resolveServiceArea } from "@/lib/service-area";
import type { BookingState } from "@/lib/bookings/booking-state";
import { trackBookingEvent } from "@/lib/analytics/booking";
import { usualCleanToBookingPatch, readUsualClean } from "@/lib/bookings/usual-clean";
import {
  isCustomerHomeBookableArea,
  isMarketBookingOpen,
  resolveCustomerHomeWaitlistReason,
} from "@/lib/markets/booking-availability";
import { WaitlistSignup } from "@/components/waitlist/waitlist-signup";
import { Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Default residential home for the consolidated Clean panel. */
function withHomeDefaults(state: BookingState): Partial<BookingState> {
  if (state.propertyType) return {};
  return {
    propertyType: "house",
    bedrooms: state.bedrooms ?? 2,
    bathrooms: state.bathrooms ?? 2,
    squareFootage: state.squareFootage ?? 1500,
    extras: state.extras ?? [],
    serviceAnswers: {
      ...(state.serviceAnswers ?? {}),
      propertyType: "house",
      bookingCategory: "home",
    },
  };
}

export function AddressScreen() {
  const router = useRouter();
  const { updateState } = useBooking();
  const { state, hydrated, blocked } = useBookingGuard("address");
  const { fromReview, continuePath, reviewPath } = useReturnToReview();
  const [showUnit, setShowUnit] = useState(Boolean(state.line2?.trim()));
  const [checking, setChecking] = useState(false);

  const advanceAfterAddress = (merged: BookingState) => {
    const defaults = withHomeDefaults(merged);
    const next = { ...merged, ...defaults };
    if (Object.keys(defaults).length > 0) updateState(defaults);

    if (fromReview) {
      router.push(reviewPath);
      return;
    }
    const nextId = getNextScreen("address", next);
    router.push(continuePath(BOOKING_SCREEN_PATHS[nextId]));
  };

  const applyAddress = (value: Partial<BookingState>, autoAdvance = false) => {
    const next = buildAddressStatePatch(state, value);
    updateState(next);

    const marketId = next.marketId ?? state.marketId;
    if (
      autoAdvance &&
      isCustomerHomeBookableArea({ inServiceArea: next.inServiceArea, marketId }) &&
      isMarketBookingOpen(marketId)
    ) {
      trackBookingEvent("address_selected", {
        marketId,
        placeId: value.googlePlaceId,
      });
      // Stay on screen — CTA "Check my address" confirms coverage intentionally.
    }
  };

  const waitlistReason = resolveCustomerHomeWaitlistReason({
    line1: state.line1,
    postalCode: state.postalCode,
    inServiceArea: state.inServiceArea,
    marketId: state.marketId,
  });

  const flAddressReady =
    isAddressComplete(state) &&
    isCustomerHomeBookableArea({
      inServiceArea: state.inServiceArea,
      marketId: state.marketId,
    });

  const handleCheckAddress = () => {
    if (!flAddressReady) return;
    setChecking(true);
    trackBookingEvent("address_selected", { marketId: state.marketId });
    advanceAfterAddress(state);
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
      screenId="address"
      title="Where are we cleaning?"
      subtitle="Home cleaning in South Florida."
      ctaLabel="Check my address"
      ctaDisabled={!flAddressReady}
      ctaLoading={checking}
      hideDefaultTotal
      backHref={fromReview ? reviewPath : undefined}
      onContinue={handleCheckAddress}
    >
      <div className="space-y-5">
        <ReturningCustomerBanner
          onApply={(patch) => {
            const area = resolveServiceArea({
              postalCode: patch.postalCode,
              city: patch.city,
              state: patch.state,
              country: patch.country,
            });
            if (
              !isCustomerHomeBookableArea({
                inServiceArea: area.inServiceArea,
                marketId: area.marketId,
              })
            ) {
              updateState({
                ...patch,
                marketId: area.marketId,
                zoneId: area.zoneId,
                inServiceArea: area.inServiceArea,
                marketName: area.marketName ?? null,
              });
              return;
            }
            const usual = readUsualClean();
            const full = usual ? usualCleanToBookingPatch(usual) : patch;
            const merged = {
              ...state,
              ...full,
              marketId: area.marketId,
              zoneId: area.zoneId,
              inServiceArea: area.inServiceArea,
              marketName: area.marketName ?? null,
            };
            updateState(merged);
            if (merged.line2?.trim()) setShowUnit(true);
            router.push(
              full.serviceType && full.date
                ? BOOKING_SCREEN_PATHS.review
                : BOOKING_SCREEN_PATHS.service,
            );
          }}
        />

        <div>
          <Label
            htmlFor="line1"
            className="mb-2 block text-sm font-semibold text-[var(--ml-book-ink,#01193D)]"
          >
            Street address
          </Label>
          <div className="relative">
            <div className="[&_label]:sr-only [&_input]:h-14 [&_input]:rounded-xl [&_input]:border-[var(--ml-book-border)] [&_input]:pr-11 [&_input]:pl-4 [&_[data-hero-pin]]:hidden">
              <AddressAutocomplete
                value={state}
                onChange={(value) => applyAddress(value)}
                onAddressSelected={(value) => {
                  applyAddress(value, true);
                }}
                locationBiasMarket="SOUTH_FLORIDA"
                placeholder="Street address in South Florida"
                label="Street address"
                variant="hero"
                hideLocate
              />
            </div>
            <Search
              className="pointer-events-none absolute top-1/2 right-3.5 z-[1] size-4 -translate-y-1/2 text-[var(--ml-book-ink-subtle)]"
              aria-hidden
            />
          </div>
          {state.line1 && state.city ? (
            <p className="mt-2 text-sm text-[var(--ml-book-ink-muted)]">
              {[state.city, state.state, state.postalCode].filter(Boolean).join(", ")}
            </p>
          ) : null}
        </div>

        {!showUnit ? (
          <button
            type="button"
            onClick={() => setShowUnit(true)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ml-book-primary,#04CED2)]"
          >
            <Plus className="size-4" aria-hidden />
            Add apartment or unit
          </button>
        ) : (
          <div>
            <Label
              htmlFor="booking-unit"
              className="mb-2 block text-sm font-semibold text-[var(--ml-book-ink,#01193D)]"
            >
              Apartment or unit
            </Label>
            <Input
              id="booking-unit"
              value={state.line2 ?? ""}
              onChange={(e) => updateState({ line2: e.target.value })}
              placeholder="Apt, suite, floor…"
              className="booking-input-lg rounded-xl border-[var(--ml-book-border)]"
              autoComplete="address-line2"
            />
          </div>
        )}

        <SavedPlaceChips
          onSelect={(selection) => {
            const { source, ...address } = selection;
            void source;
            applyAddress(address, true);
            if (address.line2?.trim()) setShowUnit(true);
          }}
        />

        <details className="group">
          <summary className="cursor-pointer list-none text-sm font-medium text-[var(--ml-book-ink-muted)] underline-offset-2 hover:underline">
            Enter address manually
          </summary>
          <div className="mt-3">
            <ManualAddressForm
              value={state}
              onChange={(patch) => applyAddress(patch)}
              onApply={(patch) => {
                applyAddress(patch, false);
                if (patch.line2?.trim()) setShowUnit(true);
              }}
            />
          </div>
        </details>

        {waitlistReason ? (
          <WaitlistSignup
            reason={waitlistReason}
            marketId={state.marketId}
            marketName={state.marketName}
            source="booking_address"
            page="/book/address"
          />
        ) : flAddressReady ? (
          <p
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-medium",
              "bg-[var(--ml-book-selected,#E6FAFA)] text-[var(--ml-book-ink,#01193D)]",
            )}
          >
            Available in South Florida — tap Check my address to continue.
          </p>
        ) : state.line1 && state.inServiceArea === false ? (
          <p className="text-sm text-red-600" role="alert">
            We don&apos;t cover that address yet. Join the waitlist above.
          </p>
        ) : null}
      </div>
    </BookingFlowChrome>
  );
}
