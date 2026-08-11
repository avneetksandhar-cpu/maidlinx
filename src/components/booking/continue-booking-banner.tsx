"use client";

import { startTransition, useEffect, useState } from "react";
import Link from "next/link";
import {
  BOOKING_STATE_STORAGE_KEY,
  type BookingState,
} from "@/lib/bookings/booking-state";
import { BOOKING_SCREEN_PATHS, getFurthestScreenPath } from "@/lib/bookings/booking-routes";
import { Button } from "@/components/ui";

function hasMeaningfulDraft(raw: string | null): boolean {
  if (!raw) return false;
  try {
    const state = JSON.parse(raw) as Record<string, unknown>;
    return Boolean(state.line1 || state.serviceType || state.propertyType);
  } catch {
    return false;
  }
}

/**
 * Non-sensitive abandoned booking recovery — sessionStorage draft only.
 * Never stores card data.
 */
export function ContinueBookingBanner() {
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(BOOKING_STATE_STORAGE_KEY);
      if (!hasMeaningfulDraft(raw)) return;
      const state = JSON.parse(raw!) as BookingState;
      const next = getFurthestScreenPath(state) ?? BOOKING_SCREEN_PATHS.address;
      startTransition(() => setHref(next));
    } catch {
      startTransition(() => setHref(null));
    }
  }, []);

  if (!href) return null;

  return (
    <div className="rounded-2xl border border-[#D5E5DC] bg-[#F4FBF7] px-4 py-3">
      <p className="text-sm font-medium text-ink">Continue your booking</p>
      <p className="mt-1 text-xs text-ink-muted">
        We saved your progress on this device (address and service — never payment details).
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={href}>
          <Button size="sm" variant="accent">
            Continue booking
          </Button>
        </Link>
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={() => {
            try {
              sessionStorage.removeItem(BOOKING_STATE_STORAGE_KEY);
            } catch {
              // ignore
            }
            setHref(null);
          }}
        >
          Start fresh
        </Button>
      </div>
    </div>
  );
}
