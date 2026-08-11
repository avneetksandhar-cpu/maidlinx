"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BOOKING_SCREEN_PATHS, getBookingEntryPath } from "@/lib/bookings/booking-routes";
import { readUsualClean } from "@/lib/bookings/usual-clean";
import { useBooking } from "@/components/booking/booking-provider";
import { Suspense } from "react";

function BookEntryInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hydrated, state } = useBooking();

  useEffect(() => {
    if (!hydrated) return;

    const resume = searchParams?.get("resume");
    const token = searchParams?.get("token");
    if (resume) {
      router.replace(
        token
          ? `${BOOKING_SCREEN_PATHS.payment}?resume=${encodeURIComponent(resume)}&token=${encodeURIComponent(token)}`
          : BOOKING_SCREEN_PATHS.payment,
      );
      return;
    }

    const qs = searchParams?.toString() ?? "";
    // Rebook: prefill is applied — jump to date so customer only picks schedule.
    if (searchParams?.get("rebook") === "1" && state.line1 && state.serviceType) {
      router.replace(qs ? `${BOOKING_SCREEN_PATHS.date}?${qs}` : BOOKING_SCREEN_PATHS.date);
      return;
    }

    // Preserve query prefill (rebook, service=…) already handled by useBookingState.
    const usual = readUsualClean();
    const hasUsual = Boolean(usual?.line1 && usual.serviceType);
    const target = getBookingEntryPath({ hasUsualClean: hasUsual });

    // If draft already has a completed address, skip straight to property.
    if (state.line1 && state.inServiceArea && state.marketId) {
      router.replace(
        qs ? `${BOOKING_SCREEN_PATHS.property}?${qs}` : BOOKING_SCREEN_PATHS.property,
      );
      return;
    }

    router.replace(qs ? `${target}?${qs}` : target);
  }, [hydrated, router, searchParams, state.line1, state.inServiceArea, state.marketId, state.serviceType]);

  return (
    <div className="flex min-h-[40dvh] items-center justify-center text-sm text-ink-muted">
      Starting booking…
    </div>
  );
}

export function BookEntryRedirect() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40dvh] items-center justify-center text-sm text-ink-muted">
          Starting booking…
        </div>
      }
    >
      <BookEntryInner />
    </Suspense>
  );
}
