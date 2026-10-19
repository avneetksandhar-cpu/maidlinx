import { routes } from "@/config/site";
import { BOOKING_SCREEN_PATHS, type BookingScreenId } from "@/lib/bookings/booking-routes";

/** After address is saved, continue here (category / what needs cleaning). */
export const BOOKING_RESUME_AFTER_AUTH = BOOKING_SCREEN_PATHS.property;

/** Screens that require a signed-in customer (gate fires after address). */
export const BOOKING_AUTH_REQUIRED_SCREENS: ReadonlySet<BookingScreenId> = new Set([
  "property",
  "service",
  "details",
  "addons",
  "date",
  "time",
  "access",
  "review",
  "payment",
]);

export function isBookingAuthRequired(screenId: BookingScreenId): boolean {
  return BOOKING_AUTH_REQUIRED_SCREENS.has(screenId);
}

/**
 * Frictionless customer auth entry — preserves booking draft via sessionStorage
 * and resumes at `next` (default: property after address).
 */
export function bookingSignInHref(next: string = BOOKING_RESUME_AFTER_AUTH): string {
  const params = new URLSearchParams();
  params.set("next", next);
  params.set("from", "booking");
  return `${routes.signIn}?${params.toString()}`;
}

export function bookingSignUpHref(next: string = BOOKING_RESUME_AFTER_AUTH): string {
  const params = new URLSearchParams();
  params.set("next", next);
  params.set("from", "booking");
  return `${routes.signUp}?${params.toString()}`;
}

export function isBookingAuthReturn(from: string | null | undefined): boolean {
  return from === "booking";
}
