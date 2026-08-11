export {
  MATCH_WEIGHTS,
  MATCH_THRESHOLDS,
  MATCH_FACTOR_LABELS,
  DEFAULT_MATCH_LIMIT,
  DEFAULT_OFFER_EXPIRY_HOURS,
  SPECIALTY_SERVICE_TYPES,
  MAX_REASON_CHIPS,
} from "@/lib/matching/config";
export {
  calculateMatchScore,
  computeMatchScore,
  arrivalWindowFromScheduledAt,
} from "@/lib/matching/calculateMatchScore";
export { scoreCleaner } from "@/lib/matching/scoreCleaner";
export {
  rankCleaners,
  rankCleanersForBooking,
  type RankCleanersOptions,
} from "@/lib/matching/rankCleaners";
export {
  checkEligibility,
  filterEligibleCleaners,
  isEligible,
  type EligibilityReasonCode,
  type EligibilityResult,
  type EligibilityBooking,
  type EligibilityCleaner,
  type EligibilityContext,
} from "@/lib/matching/eligibility";
export {
  createOffer,
  acceptOffer,
  adminAssignCleaner,
  cancelAssignment,
  markAwaitingAssignment,
  listOffersForBooking,
  listPendingOffersForCleaner,
  type BookingOffer,
  type OfferStatus,
} from "@/lib/matching/assignment";
export { haversineKm, resolveDistance, isInServiceArea } from "@/lib/matching/geo";
export {
  optimizeCleanerDaySchedule,
  type BatchJobCandidate,
  type BatchCleanerDay,
  type BatchOptimizeInput,
  type BatchOptimizeResult,
} from "@/lib/matching/batch";
export type {
  MatchBooking,
  MatchCleaner,
  MatchContext,
  MatchFactor,
  MatchFactorKey,
  MatchInput,
  MatchResult,
  ScoredCleaner,
  MatchExistingJob,
} from "@/lib/matching/types";
