"use client";

import { useSyncExternalStore } from "react";
import { BOOKING_SCREEN_PATHS } from "@/lib/bookings/booking-routes";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange);
  return () => window.removeEventListener("popstate", onStoreChange);
}

function getSnapshot(): boolean {
  return new URLSearchParams(window.location.search).get("from") === "review";
}

function getServerSnapshot(): boolean {
  return false;
}

/** True when editing a prior answer from Review — Continue should return there. */
export function useReturnToReview(): {
  fromReview: boolean;
  reviewPath: string;
  continuePath: (defaultPath: string) => string;
} {
  const fromReview = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    fromReview,
    reviewPath: BOOKING_SCREEN_PATHS.review,
    continuePath: (defaultPath: string) =>
      fromReview ? BOOKING_SCREEN_PATHS.review : defaultPath,
  };
}
