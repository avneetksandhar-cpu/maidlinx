import {
  MATCH_FACTOR_LABELS,
  MATCH_THRESHOLDS,
  MATCH_WEIGHTS,
  MAX_REASON_CHIPS,
  SPECIALTY_SERVICE_TYPES,
} from "@/lib/matching/config";
import { resolveDistance } from "@/lib/matching/geo";
import type {
  MatchBooking,
  MatchCleaner,
  MatchContext,
  MatchFactor,
  MatchFactorKey,
  MatchInput,
  MatchResult,
  MatchThresholds,
} from "@/lib/matching/types";
import { ARRIVAL_WINDOWS } from "@/lib/bookings/constants";

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function clampScore(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.round(Math.min(100, Math.max(0, value)));
}

function resolveConfig(context: MatchContext): {
  weights: Record<MatchFactorKey, number>;
  thresholds: MatchThresholds;
} {
  return {
    weights: { ...MATCH_WEIGHTS, ...context.configOverride?.weights },
    thresholds: { ...MATCH_THRESHOLDS, ...context.configOverride?.thresholds },
  };
}

function factor(
  key: MatchFactorKey,
  score: number,
  weight: number,
  reason: string,
  skipped: boolean,
): MatchFactor {
  const normalized = clamp01(score);
  const points = normalized * weight;
  const earned = Math.round(points);
  const label = MATCH_FACTOR_LABELS[key];
  return {
    key,
    label,
    score: normalized,
    weight,
    points,
    reason,
    skipped,
    breakdownLabel: `${label} ${earned}/${weight}`,
  };
}

/** Map scheduled_at hour → morning/afternoon/evening window id. */
export function arrivalWindowFromScheduledAt(scheduledAt: string): string | null {
  const date = new Date(scheduledAt);
  if (Number.isNaN(date.getTime())) return null;
  const hour = date.getHours();
  for (const window of ARRIVAL_WINDOWS) {
    if (hour >= window.startHour && hour < window.endHour) {
      return window.id;
    }
  }
  if (hour < ARRIVAL_WINDOWS[0]!.startHour) return "morning";
  return "evening";
}

function scoreTravelFit(
  booking: MatchBooking,
  cleaner: MatchCleaner,
  weight: number,
  thresholds: MatchThresholds,
): MatchFactor {
  const resolved = resolveDistance({
    bookingLat: booking.addressLatitude,
    bookingLng: booking.addressLongitude,
    cleanerLat: cleaner.latitude,
    cleanerLng: cleaner.longitude,
    bookingPostal: booking.addressPostalCode,
    cleanerPostal: cleaner.postalCode,
    bookingCity: booking.addressCity,
    bookingState: booking.addressState,
    cleanerCity: cleaner.city,
    cleanerState: cleaner.state,
  });

  if (resolved.kind === "unknown") {
    return factor("travelFit", thresholds.neutralFactorScore, weight, "Distance unknown", true);
  }

  const radius = Math.max(cleaner.serviceRadiusKm || thresholds.maxDistanceKm, 1);
  const distanceKm = resolved.distanceKm;
  const etaMinutes = (distanceKm / thresholds.averageSpeedKmh) * 60;

  if (distanceKm > radius) {
    return factor(
      "travelFit",
      0.05,
      weight,
      `${distanceKm.toFixed(0)} km outside ${radius} km radius`,
      false,
    );
  }

  const distanceScore =
    distanceKm <= thresholds.idealDistanceKm
      ? 1
      : clamp01(1 - (distanceKm - thresholds.idealDistanceKm) / Math.max(thresholds.maxDistanceKm - thresholds.idealDistanceKm, 1));

  const etaScore =
    etaMinutes <= thresholds.idealEtaMinutes
      ? 1
      : clamp01(1 - (etaMinutes - thresholds.idealEtaMinutes) / Math.max(thresholds.maxEtaMinutes - thresholds.idealEtaMinutes, 1));

  // Closest ≠ quickest: weight travel time over raw km (Uber principle, not nearest-only).
  const score = distanceScore * 0.4 + etaScore * 0.6;
  const label =
    resolved.kind === "haversine"
      ? `~${Math.round(etaMinutes)} min · ${distanceKm.toFixed(1)} km`
      : resolved.kind === "postal"
        ? resolved.matchLevel === "exact"
          ? "Same postal code"
          : "Nearby postal"
        : "Same city";

  return factor("travelFit", score, weight, label, resolved.kind !== "haversine");
}

function scoreReliability(
  cleaner: MatchCleaner,
  context: MatchContext,
  weight: number,
  thresholds: MatchThresholds,
): MatchFactor {
  const completed = context.completedJobsByProfileId.get(cleaner.profileId) ?? 0;
  const cancelled = context.cancelledJobsByProfileId.get(cleaner.profileId) ?? 0;
  const total = completed + cancelled;

  if (total === 0) {
    return factor("reliability", thresholds.neutralFactorScore, weight, "No job history", true);
  }

  const completionRate = completed / total;
  const cancelRate = cancelled / total;
  // Reliability rewards completion and penalizes cancellations.
  const score = clamp01(completionRate * (1 - cancelRate * 0.85));
  return factor(
    "reliability",
    score,
    weight,
    `${Math.round(completionRate * 100)}% completion · ${Math.round(cancelRate * 100)}% cancel`,
    false,
  );
}

function scoreCustomerRating(
  cleaner: MatchCleaner,
  weight: number,
  thresholds: MatchThresholds,
): MatchFactor {
  if (cleaner.ratingCount < thresholds.minRatingCount) {
    return factor(
      "customerRating",
      thresholds.neutralFactorScore,
      weight,
      "New — no rating history",
      true,
    );
  }

  const score = clamp01(cleaner.ratingAverage / thresholds.idealRating);
  return factor(
    "customerRating",
    score,
    weight,
    `${cleaner.ratingAverage.toFixed(1)}★ (${cleaner.ratingCount})`,
    false,
  );
}

function scoreServiceExperience(
  booking: MatchBooking,
  cleaner: MatchCleaner,
  weight: number,
  thresholds: MatchThresholds,
): MatchFactor {
  let score = 0.4;
  const bits: string[] = [];
  const years = cleaner.yearsExperience ?? 0;
  const specialty = SPECIALTY_SERVICE_TYPES.has(booking.serviceType);

  if (cleaner.isVerified) {
    score += 0.2;
    bits.push("Approved");
  }

  if (specialty) {
    if (years >= thresholds.specialtyExperienceYears) {
      score += 0.3;
      bits.push(`${years}y specialty`);
    } else if (years >= 1) {
      score += 0.15;
      bits.push(`${years}y exp`);
    }
  } else if (years >= 1) {
    score += 0.2;
    bits.push(`${years}y exp`);
  }

  const extras = booking.extrasKeys.length;
  if (extras >= 3 || booking.bedrooms + booking.bathrooms >= 6) {
    if (years >= thresholds.specialtyExperienceYears || cleaner.ratingAverage >= 4.5) {
      score += 0.1;
      bits.push("Handles complex jobs");
    } else {
      score -= 0.05;
    }
  }

  return factor(
    "serviceExperience",
    clamp01(score),
    weight,
    bits[0] ?? "Qualified",
    false,
  );
}

function scoreScheduleFit(
  booking: MatchBooking,
  cleaner: MatchCleaner,
  context: MatchContext,
  weight: number,
  thresholds: MatchThresholds,
): MatchFactor {
  const slots = context.availabilityByProfileId.get(cleaner.profileId);
  if (!slots || slots.length === 0) {
    return factor("scheduleFit", thresholds.neutralFactorScore, weight, "Availability unknown", true);
  }

  const scheduled = new Date(booking.scheduledAt);
  if (Number.isNaN(scheduled.getTime())) {
    return factor("scheduleFit", thresholds.neutralFactorScore, weight, "Schedule unknown", true);
  }

  const dayOfWeek = scheduled.getDay();
  const windowId = arrivalWindowFromScheduledAt(booking.scheduledAt);
  const daySlots = slots.filter((s) => s.dayOfWeek === dayOfWeek);
  const openDay = daySlots.some((s) => s.isAvailable);

  if (windowId) {
    const exact = daySlots.find((s) => s.arrivalWindow === windowId);
    if (exact?.isAvailable) {
      return factor("scheduleFit", 1, weight, `Free ${windowId}`, false);
    }
    if (openDay) {
      return factor("scheduleFit", 0.55, weight, "Free that day, different window", false);
    }
    return factor("scheduleFit", 0.1, weight, "Not available that day", false);
  }

  if (openDay) {
    return factor("scheduleFit", 0.7, weight, "Available that day", false);
  }
  return factor("scheduleFit", 0.1, weight, "Not available that day", false);
}

function scoreRepeatCustomer(
  cleaner: MatchCleaner,
  context: MatchContext,
  weight: number,
): MatchFactor {
  if (context.favoriteProfileIds.has(cleaner.profileId)) {
    return factor("repeatCustomer", 1, weight, "Customer favorite", false);
  }
  if (context.repeatProfileIds.has(cleaner.profileId)) {
    return factor("repeatCustomer", 0.75, weight, "Previously cleaned for customer", false);
  }
  return factor("repeatCustomer", 0.35, weight, "New to customer", false);
}

function sameLocalDay(aIso: string, bIso: string): boolean {
  const a = new Date(aIso);
  const b = new Date(bIso);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return false;
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

function jobsTodayForCleaner(
  booking: MatchBooking,
  cleaner: MatchCleaner,
  context: MatchContext,
): number {
  const precomputed = context.jobsTodayByProfileId?.get(cleaner.profileId);
  if (precomputed != null) return precomputed;

  const existing = context.existingJobsByProfileId?.get(cleaner.profileId) ?? [];
  return existing.filter(
    (job) => job.bookingId !== booking.id && sameLocalDay(job.scheduledAt, booking.scheduledAt),
  ).length;
}

function scoreOperationalFit(
  booking: MatchBooking,
  cleaner: MatchCleaner,
  context: MatchContext,
  weight: number,
  thresholds: MatchThresholds,
): MatchFactor {
  let score = thresholds.neutralFactorScore;
  const bits: string[] = [];

  const payoutCents = Math.max(0, booking.subtotalCents);
  if (payoutCents > 0) {
    score = clamp01(0.3 + 0.35 * clamp01(payoutCents / thresholds.idealPayoutCents));
    bits.push(`~$${(payoutCents / 100).toFixed(0)} payout`);
  }

  // Workload balancing — prefer cleaners with lighter same-day load.
  const jobsToday = jobsTodayForCleaner(booking, cleaner, context);
  if (jobsToday <= 0) {
    score = clamp01(score + 0.2);
    bits.unshift("Light day");
  } else if (jobsToday === 1) {
    score = clamp01(score + 0.08);
    bits.unshift("1 job today");
  } else if (jobsToday === 2) {
    score = clamp01(score - 0.05);
    bits.unshift("2 jobs today");
  } else {
    score = clamp01(score - 0.15 * Math.min(jobsToday - 2, 3));
    bits.unshift(`${jobsToday} jobs today`);
  }

  if (cleaner.hasVehicle) {
    score = clamp01(score + 0.08);
    if (bits.length < 2) bits.push("Has vehicle");
  }

  if (booking.requiresVehicle && cleaner.hasVehicle) {
    score = clamp01(score + 0.12);
  }

  return factor(
    "operationalFit",
    clamp01(score),
    weight,
    bits[0] ?? "Standard ops fit",
    payoutCents <= 0 && jobsToday === 0,
  );
}

function buildReasonChips(factors: MatchFactor[]): string[] {
  const chips: string[] = [];
  const pushUnique = (reason: string) => {
    if (!reason || chips.includes(reason) || chips.length >= MAX_REASON_CHIPS) return;
    chips.push(reason);
  };

  const priorityKeys: MatchFactorKey[] = [
    "repeatCustomer",
    "scheduleFit",
    "travelFit",
    "customerRating",
    "reliability",
  ];
  for (const key of priorityKeys) {
    const f = factors.find((item) => item.key === key);
    if (!f || f.skipped || f.points <= 0) continue;
    if (key === "repeatCustomer" && f.score < 0.7) continue;
    pushUnique(f.reason);
  }

  const ranked = [...factors].sort((a, b) => b.points - a.points);
  for (const f of ranked) {
    if (f.skipped && f.score <= MATCH_THRESHOLDS.neutralFactorScore) continue;
    if (f.points <= 0) continue;
    pushUnique(f.reason);
  }

  return chips.slice(0, MAX_REASON_CHIPS);
}

/**
 * Compute Match Score (0–100) for one eligible cleaner against one booking.
 * Pure — no I/O. Call only after eligibility passes.
 */
export function calculateMatchScore(input: MatchInput): MatchResult {
  const { booking, cleaner, context } = input;
  const { weights, thresholds } = resolveConfig(context);

  const factors: MatchFactor[] = [
    scoreTravelFit(booking, cleaner, weights.travelFit, thresholds),
    scoreReliability(cleaner, context, weights.reliability, thresholds),
    scoreCustomerRating(cleaner, weights.customerRating, thresholds),
    scoreServiceExperience(booking, cleaner, weights.serviceExperience, thresholds),
    scoreScheduleFit(booking, cleaner, context, weights.scheduleFit, thresholds),
    scoreRepeatCustomer(cleaner, context, weights.repeatCustomer),
    scoreOperationalFit(booking, cleaner, context, weights.operationalFit, thresholds),
  ];

  const raw = factors.reduce((sum, f) => sum + f.points, 0);
  return {
    score: clampScore(raw),
    factors,
    reasonChips: buildReasonChips(factors),
    breakdown: factors.map((f) => f.breakdownLabel),
  };
}

/** Alias used by Dispatch algorithm docs / older call sites. */
export const computeMatchScore = calculateMatchScore;
