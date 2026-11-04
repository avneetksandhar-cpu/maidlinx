/**
 * App Store / Info.plist location purpose strings for MaidLinx (Capacitor iOS shell).
 *
 * Copy these into `ios/App/App/Info.plist` when `npx cap add ios` is run.
 * Do not invent additional location uses beyond what the product actually does.
 */

/** NSLocationWhenInUseUsageDescription */
export const IOS_LOCATION_WHEN_IN_USE_PURPOSE =
  "MaidLinx uses your location to help fill your cleaning address when you tap Use current location, and — for cleaners — to share live job status with the customer while you are en route or on site. You can always enter an address manually instead.";

/** NSLocationAlwaysAndWhenInUseUsageDescription — not required; we do not use Always. */
export const IOS_LOCATION_ALWAYS_PURPOSE: null = null;

/**
 * Product behavior summary for App Privacy / review notes:
 * - Customer: optional one-shot geolocation → reverse-geocode → street address fields.
 * - Manual address entry always available when GPS is denied or unavailable.
 * - Cleaner: watchPosition only while job status is on_the_way / arrived; cleared otherwise.
 */
export const LOCATION_USAGE_SUMMARY = {
  customerBooking:
    "Optional GPS to reverse-geocode a service address; manual entry fallback on denial.",
  cleanerLiveJob:
    "Precise location shared only during en-route / arrived job statuses for customer ETA.",
  background: false,
} as const;
