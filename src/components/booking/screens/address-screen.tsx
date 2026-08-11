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
import { resolveServiceArea } from "@/lib/service-area";
import type { BookingState } from "@/lib/bookings/booking-state";
import { trackBookingEvent } from "@/lib/analytics/booking";
import { usualCleanToBookingPatch, readUsualClean } from "@/lib/bookings/usual-clean";

export function AddressScreen() {
  const router = useRouter();
  const { updateState } = useBooking();
  const { state, hydrated, blocked } = useBookingGuard("address");

  const applyAddress = (value: Partial<BookingState>, autoAdvance = false) => {
    const area = resolveServiceArea({
      postalCode: value.postalCode,
      city: value.city,
      state: value.state,
      country: value.country,
    });
    const next: Partial<BookingState> = {
      ...value,
      marketId: area.marketId,
      zoneId: area.zoneId,
      inServiceArea: area.inServiceArea,
      marketName: area.marketName ?? null,
      step: area.inServiceArea ? 2 : 1,
    };
    updateState(next);

    if (autoAdvance && area.inServiceArea) {
      trackBookingEvent("address_selected", {
        marketId: area.marketId,
        placeId: value.googlePlaceId,
      });
      router.push(BOOKING_SCREEN_PATHS.property);
    }
  };

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
      title="Where do you need cleaning?"
      subtitle="Search an address, use your current location, or pick a saved place."
      hideCta={!state.line1 || state.inServiceArea === false}
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

        {state.line1 && state.inServiceArea === false ? (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950">
            We&apos;re not in your area yet.{" "}
            <a
              className="font-medium underline underline-offset-2"
              href="mailto:support@maidlinx.com?subject=MaidLinx%20waitlist"
            >
              Join the waitlist
            </a>
          </p>
        ) : state.marketName && state.inServiceArea ? (
          <p className="text-sm text-accent">Available in {state.marketName}</p>
        ) : null}
      </div>
    </BookingFlowChrome>
  );
}
