"use client";

import { ChevronRight } from "lucide-react";
import { AddressAutocomplete } from "@/components/booking/address-autocomplete";
import type { BookingState } from "@/lib/bookings/booking-state";

interface HeroSearchProps {
  value: BookingState;
  onChange: (value: Partial<BookingState>) => void;
  onAddressSelected: (value: Partial<BookingState>) => void;
  onFindCleaners: () => void;
  outOfArea?: boolean;
}

export function HeroSearch({
  value,
  onChange,
  onAddressSelected,
  onFindCleaners,
  outOfArea = false,
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

      <button
        type="button"
        onClick={onFindCleaners}
        className="inline-flex h-[56px] w-full items-center justify-center gap-2 rounded-[14px] bg-[var(--maidlinx-green)] px-6 text-base font-semibold text-white transition-colors hover:bg-[var(--maidlinx-green-dark)] sm:h-[58px] sm:w-[260px]"
      >
        Find cleaners
        <ChevronRight className="size-5" aria-hidden />
      </button>

      {outOfArea ? (
        <p className="text-sm text-[var(--maidlinx-muted)]">
          We&apos;re not in your area yet.{" "}
          <a
            className="font-medium text-[var(--maidlinx-green)] underline-offset-2 hover:underline"
            href="mailto:support@maidlinx.com?subject=MaidLinx%20waitlist"
          >
            Join the waitlist
          </a>
        </p>
      ) : null}
    </div>
  );
}
