"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/components/booking/booking-provider";
import {
  getGuardRedirect,
  type BookingScreenId,
} from "@/lib/bookings/booking-routes";
import { trackBookingScreen, trackFunnelEvent } from "@/lib/analytics/booking-funnel";

function subscribeToUrl(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange);
  return () => window.removeEventListener("popstate", onStoreChange);
}

function getResumeParamSnapshot(): boolean {
  return Boolean(new URLSearchParams(window.location.search).get("resume"));
}

function getResumeParamServerSnapshot(): boolean {
  return false;
}

/** Redirect back if prior required steps are incomplete. */
export function useBookingGuard(screenId: BookingScreenId) {
  const router = useRouter();
  const { state, hydrated } = useBooking();
  const resumeParam = useSyncExternalStore(
    subscribeToUrl,
    getResumeParamSnapshot,
    getResumeParamServerSnapshot,
  );

  const allowResumePayment =
    screenId === "payment" && Boolean(resumeParam || state.bookingId);

  useEffect(() => {
    if (!hydrated) return;
    if (allowResumePayment) return;
    const redirect = getGuardRedirect(screenId, state);
    if (redirect) {
      trackFunnelEvent("booking_abandoned", {
        reason: "guard_redirect",
        from: screenId,
        to: redirect,
      });
      router.replace(redirect);
    }
  }, [hydrated, screenId, state, router, allowResumePayment]);

  useEffect(() => {
    if (!hydrated) return;
    if (allowResumePayment) {
      trackBookingScreen("payment", { resume: true });
      return;
    }
    const redirect = getGuardRedirect(screenId, state);
    if (redirect) return;
    trackBookingScreen(screenId);
  }, [hydrated, screenId, allowResumePayment]); // eslint-disable-line react-hooks/exhaustive-deps -- fire once per allowed screen

  const blocked =
    !hydrated
      ? true
      : allowResumePayment
        ? false
        : Boolean(getGuardRedirect(screenId, state));

  return { state, hydrated, blocked };
}
