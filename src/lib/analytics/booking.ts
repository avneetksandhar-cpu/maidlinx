/**
 * Lightweight booking funnel analytics.
 * Logs to console in all environments; replace sink later (Segment/PostHog/etc).
 */

export type BookingAnalyticsEvent =
  | "address_started"
  | "address_selected"
  | "property_selected"
  | "service_selected"
  | "addon_selected"
  | "date_selected"
  | "checkout_started"
  | "payment_started"
  | "booking_completed"
  | "booking_abandoned";

export type BookingAnalyticsProps = Record<string, string | number | boolean | null | undefined>;

type AnalyticsSink = (event: BookingAnalyticsEvent, props?: BookingAnalyticsProps) => void;

let sink: AnalyticsSink = (event, props) => {
  if (typeof console !== "undefined" && typeof console.info === "function") {
    console.info("[maidlinx:analytics]", event, props ?? {});
  }
};

export function setBookingAnalyticsSink(next: AnalyticsSink) {
  sink = next;
}

export function trackBookingEvent(event: BookingAnalyticsEvent, props?: BookingAnalyticsProps) {
  try {
    sink(event, props);
  } catch {
    // Never break booking UX for analytics failures.
  }
}
