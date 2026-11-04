"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BOOKING_SCREEN_PATHS,
  getBookingEntryPath,
  getFurthestScreenPath,
  isAddressComplete,
} from "@/lib/bookings/booking-routes";
import { bookingSignInHref, isBookingAuthRequired } from "@/lib/bookings/booking-auth";
import { readUsualClean } from "@/lib/bookings/usual-clean";
import { useBooking } from "@/components/booking/booking-provider";
import { useAuthSession } from "@/hooks/use-auth-session";
import type { BookingScreenId } from "@/lib/bookings/booking-routes";

function pathToScreenId(path: string): BookingScreenId | null {
  const entry = Object.entries(BOOKING_SCREEN_PATHS).find(([, p]) => path.startsWith(p));
  return (entry?.[0] as BookingScreenId | undefined) ?? null;
}

function BookEntryInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hydrated, state } = useBooking();
  const authStatus = useAuthSession();

  useEffect(() => {
    if (!hydrated || authStatus === "loading") return;

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
    // Rebook: prefill is applied — jump to When so customer only picks schedule.
    if (searchParams?.get("rebook") === "1" && state.line1 && state.serviceType) {
      const target = BOOKING_SCREEN_PATHS.date;
      router.replace(qs ? `${target}?${qs}` : target);
      return;
    }

    // Returning customer with usual clean — land on address (or resume mid-funnel).
    const usual = readUsualClean();
    const hasUsual = Boolean(usual?.line1 && usual.serviceType);
    if (hasUsual || searchParams?.get("skipWelcome") === "1") {
      const target = getBookingEntryPath({ hasUsualClean: hasUsual });
      router.replace(qs ? `${target}?${qs}` : target);
      return;
    }

    // Draft already has address — resume furthest step (auth only at review/pay).
    if (isAddressComplete(state)) {
      const furthest = getFurthestScreenPath(state);
      const screenId = pathToScreenId(furthest.split("?")[0] ?? furthest);
      if (
        screenId &&
        isBookingAuthRequired(screenId) &&
        authStatus !== "authenticated"
      ) {
        router.replace(bookingSignInHref(furthest));
        return;
      }
      router.replace(qs ? `${furthest}?${qs}` : furthest);
      return;
    }

    // Default: address first.
    const entry = getBookingEntryPath();
    router.replace(qs ? `${entry}?${qs}` : entry);
  }, [
    hydrated,
    authStatus,
    router,
    searchParams,
    state.line1,
    state.propertyType,
    state.serviceType,
    state.city,
    state.postalCode,
    state.marketId,
  ]);

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
