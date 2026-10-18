export const MIAMI_TIMEZONE = "America/New_York";
export const MIN_BOOKING_CENTS = 50_000;
export const DEFAULT_CURRENCY = "usd";

export const EVENT_STATUSES = [
  "draft",
  "discovery_ready",
  "bookable",
  "cancelled",
  "expired",
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const SERVICE_TYPES = ["guest_list", "ticket", "vip_table", "concierge"] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const SPEND_BANDS = ["band_500_1500", "band_1500_5000", "band_5000_plus"] as const;
export type SpendBand = (typeof SPEND_BANDS)[number];

export const SPEND_BAND_LABELS: Record<SpendBand, string> = {
  band_500_1500: "$500–$1.5K",
  band_1500_5000: "$1.5K–$5K",
  band_5000_plus: "$5K+",
};

export const REQUEST_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "routed",
  "wingman_accepted",
  "wingman_declined",
  "revised_terms",
  "awaiting_customer",
  "accepted",
  "payment_pending",
  "paid",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "refunded",
  "disputed",
] as const;

/** Customer-facing TEST booking states mapped onto booking_requests.status. */
export const BOOKING_FLOW_STATES = [
  "draft",
  "payment_pending",
  "paid",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "refunded",
  "disputed",
] as const;
export type BookingFlowState = (typeof BOOKING_FLOW_STATES)[number];
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const WINGMAN_STATUSES = ["pending", "verified", "paused", "rejected"] as const;
export type WingmanStatus = (typeof WINGMAN_STATUSES)[number];

export const APPLICATION_STATUSES = [
  "not_contacted",
  "contacted",
  "in_review",
  "rejected",
  "approved",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const VERIFICATION_GATES = [
  "consent",
  "identity",
  "phone",
  "email",
  "inventory_authority",
  "agreement",
  "payout",
  "media",
  "policy",
  "test_booking",
  "gov_id",
  "selfie_liveness",
  "screening_manual",
  "code_of_conduct",
  "emergency_contact",
  "service_boundary",
  "no_show_policy",
  "payment_auth",
] as const;
export type VerificationGate = (typeof VERIFICATION_GATES)[number];

export const TRUST_VENDOR_GATES = ["gov_id", "selfie_liveness"] as const;

export const WINGMAN_EVENT_MARKS = [
  "interested",
  "recommended",
  "available_virtually",
  "available_in_person",
  "experienced_venue",
] as const;
export type WingmanEventMark = (typeof WINGMAN_EVENT_MARKS)[number];

export const WINGMAN_EVENT_MARK_LABELS: Record<WingmanEventMark, string> = {
  interested: "Interested",
  recommended: "Recommended",
  available_virtually: "Available virtually",
  available_in_person: "Available in person",
  experienced_venue: "Experienced with this venue",
};

export const LAUNCH_SERVICE_FLAGS = {
  verified_matching: true,
  vip_table_bottle: true,
  guest_list_access: true,
  plan_my_night: true,
  private_chat: true,
  night_pass: true,
  live_support: true,
} as const;

export const FUTURE_SERVICE_FLAGS = {
  miami_trip_pass: false,
  wingman_black: false,
  preference_passport: false,
  crew_split: false,
  dining_transport_addons: false,
  corporate_hosts: false,
  hotel_referral: false,
  wingman_pro: false,
  venue_partner_dashboard: false,
  multi_city: false,
  saved_preferences: false,
  one_tap_rebook: false,
  multi_night_packages: false,
  birthday_bachelor: false,
  group_invites: false,
  last_minute_priority: false,
  member_pricing: false,
  other_cities: false,
  improving_recs: false,
  wingman_passport: false,
  in_person_insurance_cleared: false,
} as const;

/** Developer 10% + $200/month is not a customer fee and is not stored here. */
export const DEVELOPER_AGREEMENT_NOTE =
  "Developer 10% of monthly revenue + $200/month is a separate owner agreement, not a marketplace take rate or customer fee.";
