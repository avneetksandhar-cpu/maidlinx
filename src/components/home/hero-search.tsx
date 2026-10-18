"use client";

import { ChevronRight } from "lucide-react";
import { AddressAutocomplete } from "@/components/booking/address-autocomplete";
import { WaitlistSignup } from "@/components/waitlist/waitlist-signup";
import type { BookingState } from "@/lib/bookings/booking-state";
import type { WaitlistReason } from "@/lib/markets/booking-availability";

interface HeroSearchProps {
  value: BookingState;
  onChange: (value: Partial<BookingState>) => void;
  onAddressSelected: (value: Partial<BookingState>) => void;
  onFindCleaners: () => void;
  waitlistReason?: WaitlistReason | null;
}

export function HeroSearch({
  value,
  onChange,
  onAddressSelected,
  onFindCleaners,
  waitlistReason = null,
}: HeroSearchProps) {
  return (
    <div className="space-y-4">
      <AddressAutocomplete
        value={value}
        onChange={onChange}
        variant="hero"
        label="Where do you need cleaning?"
        placeholder="Where do you need cleaning?"
        onAddressSelected={onAddressSelected}
        className="home-hero-search"
      />

      {!waitlistReason ? (
        <button
          type="button"
          onClick={onFindCleaners}
          className="inline-flex h-[56px] w-full items-center justify-center gap-2 rounded-[14px] bg-[var(--maidlinx-green)] px-6 text-base font-semibold text-white transition-colors hover:bg-[var(--maidlinx-green-dark)] sm:h-[58px] sm:w-[260px]"
        >
          Find cleaners
          <ChevronRight className="size-5" aria-hidden />
        </button>
      ) : (
        <WaitlistSignup
          reason={waitlistReason}
          marketId={value.marketId}
          marketName={value.marketName}
          source="homepage_hero"
          page="/"
          variant="compact"
        />
      )}
    </div>
  );
}
