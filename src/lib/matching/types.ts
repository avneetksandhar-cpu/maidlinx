/** Factor keys for Match Engine V1 (weights live in config.ts only). */
export type MatchFactorKey =
  | "travelFit"
  | "reliability"
  | "customerRating"
  | "serviceExperience"
  | "scheduleFit"
  | "repeatCustomer"
  | "operationalFit";

/** Booking fields needed for scoring (decoupled from DB row shape). */
export interface MatchBooking {
  id: string;
  customerId: string | null;
  serviceType: string;
  /** Marketplace service id when known (e.g. svc_residential). */
  serviceId?: string | null;
  marketId?: string | null;
  zoneId?: string | null;
  scheduledAt: string;
  arrivalWindowStart: string | null;
  arrivalWindowEnd: string | null;
  /** Estimated job duration in minutes (from pricing). */
  durationMinutes?: number;
  notes: string | null;
  bedrooms: number;
  bathrooms: number;
  subtotalCents: number;
  platformFeeCents: number;
  totalCents: number;
  addressCity: string | null;
  addressState: string | null;
  addressPostalCode: string | null;
  addressLatitude: number | null;
  addressLongitude: number | null;
  extrasKeys: string[];
  /** Required qualification tags from service answers / requirements. */
  requiredQualifications?: string[];
  requiresVehicle?: boolean;
}

/** Existing job used for conflict / schedule checks. */
export interface MatchExistingJob {
  bookingId: string;
  scheduledAt: string;
  durationMinutes: number;
  addressLatitude?: number | null;
  addressLongitude?: number | null;
}

/** Cleaner candidate fields needed for scoring / eligibility. */
export interface MatchCleaner {
  profileId: string;
  cleanerId: string;
  name: string;
  isActive: boolean;
  /** Approved / verified for marketplace work. */
  isVerified: boolean;
  /** Pro onboarding machine — APPROVED required for offers when set. */
  onboardingStatus?:
    | "NOT_STARTED"
    | "IN_PROGRESS"
    | "SUBMITTED"
    | "UNDER_REVIEW"
    | "APPROVED"
    | "REJECTED"
    | "SUSPENDED";
  /** Presence flag — required for offer matching when requireOnline is true. */
  isOnline?: boolean;
  yearsExperience: number | null;
  serviceRadiusKm: number;
  ratingAverage: number;
  ratingCount: number;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  /** Service legacy types and/or service ids offered. Empty = not bookable under strict gates. */
  offeredServiceTypes?: string[];
  /** Zone ids the cleaner covers. Empty = not bookable under strict gates. */
  zoneIds?: string[];
  /** Explicit cleaner home market (may be null if only zones set). */
  marketId?: string | null;
  /** Ops approval flag when distinct from isVerified. */
  approved?: boolean;
  hasVehicle?: boolean;
  qualifications?: string[];
  /** YYYY-MM-DD dates the cleaner blocked. */
  unavailableDates?: string[];
  /**
   * When set, Platform V1 approval gates result.
   * false → ineligible for offers (identity/screening/training/admin/active).
   */
  platformGatesAllowed?: boolean;
}

/** Precomputed / lookup context shared across candidates. */
export interface MatchContext {
  serviceAreaPostalCodes: Set<string>;
  serviceAreaCityStates: Set<string>;
  availabilityByProfileId: Map<string, MatchAvailabilitySlot[]>;
  completedJobsByProfileId: Map<string, number>;
  cancelledJobsByProfileId: Map<string, number>;
  favoriteProfileIds: Set<string>;
  repeatProfileIds: Set<string>;
  /** Existing assigned jobs by cleaner profile id (for conflict gates + workload). */
  existingJobsByProfileId?: Map<string, MatchExistingJob[]>;
  /**
   * Optional precomputed jobs already scheduled that day (workload balancing).
   * When omitted, scorers derive count from `existingJobsByProfileId`.
   */
  jobsTodayByProfileId?: Map<string, number>;
  /** Travel buffer minutes between jobs (default from config). */
  travelBufferMinutes?: number;
  /** When true, cleaners must be verified/approved. Default true. */
  requireVerified?: boolean;
  /** When true, cleaners must be online (isOnline). Default true. */
  requireOnline?: boolean;
  /**
   * When true (default), use hard marketplace gates:
   * market + zone + services + availability required (no soft-open legacy).
   */
  requireStrictMarketplace?: boolean;
  configOverride?: PartialMatchConfig;
}

export interface MatchAvailabilitySlot {
  dayOfWeek: number;
  arrivalWindow: string;
  isAvailable: boolean;
}

export interface PartialMatchConfig {
  weights?: Partial<Record<MatchFactorKey, number>>;
  thresholds?: Partial<MatchThresholds>;
}

export interface MatchThresholds {
  idealDistanceKm: number;
  maxDistanceKm: number;
  averageSpeedKmh: number;
  idealEtaMinutes: number;
  maxEtaMinutes: number;
  neutralFactorScore: number;
  minRatingCount: number;
  idealRating: number;
  idealPayoutCents: number;
  specialtyExperienceYears: number;
  /** Default travel buffer between jobs (minutes). */
  travelBufferMinutes: number;
  /** Default job duration when booking has none (minutes). */
  defaultJobDurationMinutes: number;
}

/** Single scored factor in the breakdown (admin WHY). */
export interface MatchFactor {
  key: MatchFactorKey;
  label: string;
  /** Normalized 0–1 quality. */
  score: number;
  weight: number;
  /** Points contributed toward the 0–100 total. */
  points: number;
  /** Short human-readable reason. */
  reason: string;
  /** True when factor used a neutral/fallback because data was missing. */
  skipped: boolean;
  /** Admin display e.g. "Travel Fit 22/25". */
  breakdownLabel: string;
}

export interface MatchResult {
  score: number;
  factors: MatchFactor[];
  reasonChips: string[];
  /** Convenience list of breakdown labels for admin UI. */
  breakdown: string[];
}

export interface ScoredCleaner {
  profileId: string;
  cleanerId: string;
  name: string;
  score: number;
  factors: MatchFactor[];
  reasonChips: string[];
  breakdown: string[];
}

export interface MatchInput {
  booking: MatchBooking;
  cleaner: MatchCleaner;
  context: MatchContext;
}
