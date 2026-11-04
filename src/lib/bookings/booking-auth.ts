import { routes } from "@/config/site";
import { BOOKING_SCREEN_PATHS, type BookingScreenId } from "@/lib/bookings/booking-routes";

/** After guest builds a quote, resume here once signed in (review → pay). */
export const BOOKING_RESUME_AFTER_AUTH = BOOKING_SCREEN_PATHS.review;

/**
 * Auth gate: address check + quote + schedule work as guest.
 * Sign-in required at review/payment (Stripe TEST checkout).
 */
export const BOOKING_AUTH_REQUIRED_SCREENS: ReadonlySet<BookingScreenId> = new Set([
  // Review is readable as guest (quote check); Stripe checkout still requires auth.
  "payment",
]);

export function isBookingAuthRequired(screenId: BookingScreenId): boolean {
  return BOOKING_AUTH_REQUIRED_SCREENS.has(screenId);
}

/**
 * Frictionless customer auth entry — preserves booking draft via sessionStorage
 * and resumes at `next` (default: review after quote + schedule).
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
