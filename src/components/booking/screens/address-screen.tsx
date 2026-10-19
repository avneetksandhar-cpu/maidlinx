"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Search } from "lucide-react";
import { AddressAutocomplete } from "@/components/booking/address-autocomplete";
import { BookingFlowChrome } from "@/components/booking/booking-flow-chrome";
import { ManualAddressForm } from "@/components/booking/manual-address-form";
import { ReturningCustomerBanner } from "@/components/booking/returning-customer-banner";
import { SavedPlaceChips } from "@/components/booking/saved-place-chips";
import { useBooking } from "@/components/booking/booking-provider";
import { useBookingGuard } from "@/components/booking/use-booking-guard";
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
  isMarketBookingOpen,
  resolveWaitlistReason,
} from "@/lib/markets/booking-availability";
import { WaitlistSignup } from "@/components/waitlist/waitlist-signup";
import { cn } from "@/lib/utils";
import { routes } from "@/config/site";
import Link from "next/link";

export function AddressScreen() {
  const router = useRouter();
  const { updateState } = useBooking();
  const { state, hydrated, blocked } = useBookingGuard("address");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

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
      const merged = { ...state, ...next };
      router.push(BOOKING_SCREEN_PATHS[getNextScreen("address", merged)]);
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
      <div
        data-theme="ml-dark"
        className="flex min-h-[40dvh] items-center justify-center bg-[var(--ml-dark-bg)] text-sm text-[var(--ml-dark-ink-muted)]"
      >
        Loading…
      </div>
    );
  }

  const currentLabel = state.line1
    ? [state.line1, state.city].filter(Boolean).join(" · ")
    : null;

  return (
    <BookingFlowChrome
      screenId="address"
      title="Select property"
      subtitle="Search or choose a saved address."
      hideCta={!isAddressComplete(state)}
      ctaLabel="Continue"
      ctaDisabled={!isAddressComplete(state)}
      onContinue={() => {
        if (!isAddressComplete(state)) return;
        trackBookingEvent("address_selected", { marketId: state.marketId });
        router.push(BOOKING_SCREEN_PATHS[getNextScreen("address", state)]);
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
                  : BOOKING_SCREEN_PATHS.service,
              );
            }
          }}
        />

        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[var(--ml-dark-ink-subtle)]"
            aria-hidden
          />
          <div className="[&_input]:pl-10 [&_label]:sr-only">
            <AddressAutocomplete
              value={state}
              onChange={(value) => applyAddress(value)}
              onAddressSelected={(value) => {
                setSelectedKey("search");
                applyAddress(value, true);
              }}
              placeholder="Search or enter address"
              label="Address"
            />
          </div>
        </div>

        {currentLabel ? (
          <button
            type="button"
            onClick={() => setSelectedKey("current")}
            aria-pressed={selectedKey === "current" || isAddressComplete(state)}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all",
              isAddressComplete(state)
                ? "border-[var(--ml-dark-mint)] bg-[var(--ml-dark-surface)] shadow-[0_0_0_1px_rgb(8_224_212_/_0.35)]"
                : "border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)]",
            )}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-[var(--ml-dark-ink)]">
                {state.line2?.trim() || state.formattedAddress?.split(",")[0] || "Selected property"}
              </span>
              <span className="mt-0.5 block text-sm text-[var(--ml-dark-ink-muted)]">
                {currentLabel}
              </span>
            </span>
            {isAddressComplete(state) ? (
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--ml-dark-mint)] text-[var(--color-accent-foreground)]">
                <Check className="size-3.5" strokeWidth={3} aria-hidden />
              </span>
            ) : null}
          </button>
        ) : null}

        <SavedPlaceChips
          onSelect={(selection) => {
            const { source, ...address } = selection;
            void source;
            setSelectedKey(selection.line1 ?? "saved");
            applyAddress(address, true);
          }}
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

        <Link
          href={routes.dashboardSavedPlaces}
          className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--ml-dark-border-strong)] px-4 py-3.5 text-sm font-medium text-[var(--ml-dark-ink-muted)] transition-colors hover:border-[var(--ml-dark-mint)]/50 hover:text-[var(--ml-dark-ink)]"
        >
          <Plus className="size-4" aria-hidden />
          Add new property
        </Link>

        {waitlistReason ? (
          <WaitlistSignup
            reason={waitlistReason}
            marketId={state.marketId}
            marketName={state.marketName}
            source="booking_address"
            page="/book/address"
          />
        ) : state.marketName && state.inServiceArea ? (
          <p className="text-sm text-[var(--ml-dark-mint)]">Available in {state.marketName}</p>
        ) : null}
      </div>
    </BookingFlowChrome>
  );
}
