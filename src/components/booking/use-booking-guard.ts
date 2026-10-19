"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/components/booking/booking-provider";
import {
  BOOKING_SCREEN_PATHS,
  getGuardRedirect,
  type BookingScreenId,
} from "@/lib/bookings/booking-routes";
import {
  bookingSignInHref,
  isBookingAuthRequired,
} from "@/lib/bookings/booking-auth";
import { useAuthSession } from "@/hooks/use-auth-session";
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

/** Redirect back if prior required steps are incomplete; auth after address. */
export function useBookingGuard(screenId: BookingScreenId) {
  const router = useRouter();
  const { state, hydrated } = useBooking();
  const authStatus = useAuthSession();
  const resumeParam = useSyncExternalStore(
    subscribeToUrl,
    getResumeParamSnapshot,
    getResumeParamServerSnapshot,
  );

  const allowResumePayment =
    screenId === "payment" && Boolean(resumeParam || state.bookingId);

  const needsAuth = isBookingAuthRequired(screenId);
  const authBlocked = needsAuth && authStatus === "guest";
  const authLoading = needsAuth && authStatus === "loading";

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
      return;
    }
    if (authBlocked) {
      const resumePath = BOOKING_SCREEN_PATHS[screenId];
      router.replace(bookingSignInHref(resumePath));
    }
  }, [hydrated, screenId, state, router, allowResumePayment, authBlocked]);

  useEffect(() => {
    if (!hydrated) return;
    if (allowResumePayment) {
      trackBookingScreen("payment", { resume: true });
      return;
    }
    const redirect = getGuardRedirect(screenId, state);
    if (redirect || authBlocked || authLoading) return;
    trackBookingScreen(screenId);
  }, [hydrated, screenId, allowResumePayment, authBlocked, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps -- fire once per allowed screen

  const blocked =
    !hydrated || authLoading
      ? true
      : allowResumePayment
        ? false
        : Boolean(getGuardRedirect(screenId, state)) || authBlocked;

  return { state, hydrated, blocked, authStatus };
}
