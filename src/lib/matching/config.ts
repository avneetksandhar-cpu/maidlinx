import type { MatchFactorKey, MatchThresholds } from "@/lib/matching/types";

/**
 * Match Engine V1 weights (points toward a 0–100 total).
 * Tune ONLY here — scorers read these constants.
 *
 * Factors: travel/ETA, reliability, rating, service fit, availability,
 * repeat customer, operational + workload. Closest ≠ quickest.
 */
export const MATCH_WEIGHTS: Record<MatchFactorKey, number> = {
  travelFit: 25,
  reliability: 20,
  customerRating: 15,
  serviceExperience: 15,
  scheduleFit: 10,
  repeatCustomer: 10,
  operationalFit: 5,
};

/** Soft/hard thresholds used by factor scorers and eligibility. */
export const MATCH_THRESHOLDS: MatchThresholds = {
  idealDistanceKm: 5,
  maxDistanceKm: 40,
  averageSpeedKmh: 35,
  idealEtaMinutes: 15,
  maxEtaMinutes: 75,
  neutralFactorScore: 0.5,
  minRatingCount: 3,
  idealRating: 5,
  idealPayoutCents: 20_000,
  specialtyExperienceYears: 2,
  travelBufferMinutes: 30,
  defaultJobDurationMinutes: 120,
};

/** Human labels for admin UI / docs. */
export const MATCH_FACTOR_LABELS: Record<MatchFactorKey, string> = {
  travelFit: "Travel Fit",
  reliability: "Reliability",
  customerRating: "Customer Rating",
  serviceExperience: "Service Experience",
  scheduleFit: "Schedule Fit",
  repeatCustomer: "Repeat Customer Match",
  operationalFit: "Operational Fit",
};

/** Service types that benefit from verified + experienced cleaners. */
export const SPECIALTY_SERVICE_TYPES = new Set([
  "deep",
  "move_in",
  "move_out",
  "move_in_out",
  "commercial",
  "office",
  "post_construction",
  "event_venue",
]);

/** How many top reason chips to surface in admin UI. */
export const MAX_REASON_CHIPS = 4;

/** Default number of ranked suggestions returned to admin. */
export const DEFAULT_MATCH_LIMIT = 8;

/** Offer expiry window (hours) when creating cleaner offers. */
export const DEFAULT_OFFER_EXPIRY_HOURS = 24;
