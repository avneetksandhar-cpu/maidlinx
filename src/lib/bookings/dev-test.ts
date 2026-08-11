/**
 * Development-only booking bypass (no Stripe charge).
 *
 * Enabled only when BOTH:
 * - NODE_ENV is not "production"
 * - ALLOW_DEV_TEST_BOOKING=true OR ALLOW_DEV_BOOKING=true in the server environment
 *
 * Defaults to false when flags are missing. In production this always returns false
 * regardless of any ALLOW_* env value. Never set these flags in production.
 *
 * Server-side check only — the UI reflects GET /api/bookings/dev-test; POST re-asserts.
 */
export const DEV_TEST_BOOKING_LABEL = "DEV TEST — NO REAL PAYMENT";

export function isDevTestBookingEnabled(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  return (
    process.env.ALLOW_DEV_TEST_BOOKING === "true" ||
    process.env.ALLOW_DEV_BOOKING === "true"
  );
}

/** @deprecated Use isDevTestBookingEnabled */
export const isDevTestBookingAllowed = isDevTestBookingEnabled;

export function assertDevTestBookingEnabled(): void {
  if (!isDevTestBookingEnabled()) {
    throw new Error(
      "DEV_TEST_BOOKING is disabled. Set ALLOW_DEV_TEST_BOOKING=true in .env.local (non-production only).",
    );
  }
}

/** @deprecated Use assertDevTestBookingEnabled */
export const assertDevTestBookingAllowed = assertDevTestBookingEnabled;
