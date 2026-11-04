/**
 * Booking funnel analytics — address → … → completed.
 *
 * Console / injectable sink today; swap sink for Segment/PostHog later.
 * Safe to call from UX or server — never throws to callers.
 *
 * Product event list (V1):
 * - funnel_address / address_started / address_selected
 * - funnel_property / property_selected
 * - funnel_details
 * - funnel_estimate (price verified on review)
 * - funnel_service / service_selected
 * - funnel_extras / addon_selected
 * - funnel_schedule / date_selected
 * - funnel_review
 * - funnel_pay / funnel_payment / checkout_started / payment_started
 * - funnel_assign / funnel_track
 * - funnel_rate (post-job; reserved)
 * - funnel_rebook (usual clean)
 * - funnel_completed / booking_completed
 * - funnel_abandoned / booking_abandoned
 * - funnel_promo / funnel_referral / funnel_prefer_pro (repeat revenue)
 *
 * Never send emails, phones, addresses, or card data in props.
 *
 * @see docs/MARKETPLACE_ROADMAP.md
 */

/** Canonical funnel + legacy event names for docs / sink adapters. */
export const BOOKING_ANALYTICS_EVENTS = [
  "funnel_address",
  "funnel_property",
  "funnel_details",
  "funnel_estimate",
  "funnel_service",
  "funnel_extras",
  "funnel_schedule",
  "funnel_review",
  "funnel_pay",
  "funnel_payment",
  "funnel_assign",
  "funnel_track",
  "funnel_rate",
  "funnel_rebook",
  "funnel_completed",
  "funnel_abandoned",
  "funnel_promo",
  "funnel_referral",
  "funnel_prefer_pro",
  "funnel_continue_draft",
  "address_started",
  "address_selected",
  "property_selected",
  "service_selected",
  "addon_selected",
  "date_selected",
  "checkout_started",
  "payment_started",
  "booking_completed",
  "booking_abandoned",
] as const;

export type BookingFunnelStep =
  | "address"
  | "property"
  | "details"
  | "estimate"
  | "service"
  | "extras"
  | "addons"
  | "schedule"
  | "date"
  | "time"
  | "access"
  | "review"
  | "pay"
  | "payment"
  | "assign"
  | "track"
  | "rate"
  | "rebook"
  | "completed"
  | "abandoned";

export type BookingFunnelEvent =
  | "funnel_address"
  | "funnel_property"
  | "funnel_details"
  | "funnel_estimate"
  | "funnel_service"
  | "funnel_extras"
  | "funnel_addons"
  | "funnel_schedule"
  | "funnel_date"
  | "funnel_time"
  | "funnel_access"
  | "funnel_review"
  | "funnel_pay"
  | "funnel_payment"
  | "funnel_assign"
  | "funnel_track"
  | "funnel_rate"
  | "funnel_rebook"
  | "funnel_completed"
  | "funnel_abandoned"
  | "funnel_promo"
  | "funnel_referral"
  | "funnel_prefer_pro"
  | "funnel_continue_draft"
  // Compatibility with existing booking.ts events
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

export type BookingFunnelProps = Record<
  string,
  string | number | boolean | null | undefined
>;

type FunnelSink = (event: BookingFunnelEvent, props?: BookingFunnelProps) => void;

const defaultSink: FunnelSink = (event, props) => {
  if (typeof console !== "undefined" && typeof console.info === "function") {
    console.info("[maidlinx:funnel]", event, props ?? {});
  }
};

let sink: FunnelSink = defaultSink;

/** Replace the collector (tests / real analytics). Pass null to restore default. */
export function setBookingFunnelSink(next: FunnelSink | null) {
  sink = next ?? defaultSink;
}

export function trackFunnelEvent(event: BookingFunnelEvent, props?: BookingFunnelProps) {
  try {
    sink(event, props);
  } catch {
    // Never break booking or matching for analytics failures.
  }
}

const STEP_TO_EVENT: Record<BookingFunnelStep, BookingFunnelEvent> = {
  address: "funnel_address",
  property: "funnel_property",
  details: "funnel_details",
  estimate: "funnel_estimate",
  service: "funnel_service",
  extras: "funnel_extras",
  addons: "funnel_addons",
  schedule: "funnel_schedule",
  date: "funnel_date",
  time: "funnel_time",
  access: "funnel_access",
  review: "funnel_review",
  pay: "funnel_pay",
  payment: "funnel_payment",
  assign: "funnel_assign",
  track: "funnel_track",
  rate: "funnel_rate",
  rebook: "funnel_rebook",
  completed: "funnel_completed",
  abandoned: "funnel_abandoned",
};

/** Track a named product step on the V1 path. */
export function trackFunnelStep(
  step: BookingFunnelStep,
  props?: BookingFunnelProps,
) {
  trackFunnelEvent(STEP_TO_EVENT[step], { step, ...props });
}

/** Map multi-screen route ids to funnel steps. */
export function trackBookingScreen(
  screenId:
    | "address"
    | "property"
    | "details"
    | "service"
    | "addons"
    | "extras"
    | "date"
    | "time"
    | "access"
    | "schedule"
    | "review"
    | "payment",
  props?: BookingFunnelProps,
) {
  const step: BookingFunnelStep =
    screenId === "payment"
      ? "payment"
      : screenId === "extras"
        ? "addons"
        : screenId === "schedule"
          ? "date"
          : screenId;
  trackFunnelStep(step, { screen: screenId, ...props });
}

// Re-export legacy tracker so call sites can migrate gradually.
export {
  trackBookingEvent,
  setBookingAnalyticsSink,
  type BookingAnalyticsEvent,
  type BookingAnalyticsProps,
} from "@/lib/analytics/booking";
