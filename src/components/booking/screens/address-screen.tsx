"use client";

import { useRouter } from "next/navigation";
import { AddressAutocomplete } from "@/components/booking/address-autocomplete";
import { BookingFlowChrome } from "@/components/booking/booking-flow-chrome";
import { ManualAddressForm } from "@/components/booking/manual-address-form";
import { ReturningCustomerBanner } from "@/components/booking/returning-customer-banner";
import { SavedPlaceChips } from "@/components/booking/saved-place-chips";
import { useBooking } from "@/components/booking/booking-provider";
import { useBookingGuard } from "@/components/booking/use-booking-guard";
import { BOOKING_SCREEN_PATHS } from "@/lib/bookings/booking-routes";
import { isAddressComplete } from "@/lib/bookings/booking-routes";
import { buildAddressStatePatch } from "@/lib/bookings/booking-helpers";
import { resolveServiceArea } from "@/lib/service-area";
import type { BookingState } from "@/lib/bookings/booking-state";
import { trackBookingEvent } from "@/lib/analytics/booking";
import { usualCleanToBookingPatch, readUsualClean } from "@/lib/bookings/usual-clean";
import {
  isMarketBookingOpen,
  resolveWaitlistReason,
} from "@/lib/markets/booking-availability";
import { WaitlistSignup } from "@/components/waitlist/waitlist-signup";

export function AddressScreen() {
  const router = useRouter();
  const { updateState } = useBooking();
  const { state, hydrated, blocked } = useBookingGuard("address");

  const applyAddress = (value: Partial<BookingState>, autoAdvance = false) => {
    const next = buildAddressStatePatch(state, value);
    updateState(next);

    if (
      autoAdvance &&
      next.inServiceArea &&
      isMarketBookingOpen(next.marketId ?? state.marketId)
    ) {
      trackBookingEvent("address_selected", {
        marketId: next.marketId ?? state.marketId,
        placeId: value.googlePlaceId,
      });
      router.push(BOOKING_SCREEN_PATHS.property);
    }
  };

  const waitlistReason = resolveWaitlistReason({
    line1: state.line1,
    postalCode: state.postalCode,
    inServiceArea: state.inServiceArea,
    marketId: state.marketId,
  });

  if (!hydrated || blocked) {
    return (
      <div className="flex min-h-[40dvh] items-center justify-center text-sm text-ink-muted">
        Loading…
      </div>
    );
  }

  return (
    <BookingFlowChrome
      screenId="address"
      title="Where should we clean?"
      subtitle="Search an address, use your current location, or choose a saved place."
      hideCta={!isAddressComplete(state)}
      ctaLabel="Continue"
      ctaDisabled={!isAddressComplete(state)}
      onContinue={() => {
        if (!isAddressComplete(state)) return;
        trackBookingEvent("address_selected", { marketId: state.marketId });
        router.push(BOOKING_SCREEN_PATHS.property);
      }}
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
            updateState({
              ...patch,
              marketId: area.marketId,
              zoneId: area.zoneId,
              inServiceArea: area.inServiceArea,
              marketName: area.marketName ?? null,
            });
            if (area.inServiceArea) {
              // Usual clean often has property+service — jump ahead when complete.
              const usual = readUsualClean();
              const full = usual ? usualCleanToBookingPatch(usual) : patch;
              updateState({
                ...full,
                marketId: area.marketId,
                zoneId: area.zoneId,
                inServiceArea: area.inServiceArea,
                marketName: area.marketName ?? null,
              });
              router.push(
                full.serviceType
                  ? BOOKING_SCREEN_PATHS.review
                  : BOOKING_SCREEN_PATHS.property,
              );
            }
          }}
        />

        <SavedPlaceChips
          onSelect={(selection) => {
            const { source, ...address } = selection;
            void source;
            applyAddress(address, true);
          }}
        />

        <AddressAutocomplete
          value={state}
          onChange={(value) => applyAddress(value)}
          onAddressSelected={(value) => applyAddress(value, true)}
          placeholder="Enter street address"
          label="Address"
        />

        <ManualAddressForm
          value={state}
          onChange={(patch) => applyAddress(patch)}
          onApply={(patch) => {
            const area = resolveServiceArea({
              postalCode: patch.postalCode,
              city: patch.city,
              state: patch.state,
              country: patch.country,
            });
            if (!area.inServiceArea || !patch.line1 || !patch.city || !patch.state || !patch.postalCode) {
              return;
            }
            applyAddress(patch, true);
          }}
        />

        {waitlistReason ? (
          <WaitlistSignup
            reason={waitlistReason}
            marketId={state.marketId}
            marketName={state.marketName}
            source="booking_address"
            page="/book/address"
          />
        ) : state.marketName && state.inServiceArea ? (
          <p className="text-sm text-accent">Available in {state.marketName}</p>
        ) : null}
      </div>
    </BookingFlowChrome>
  );
}
