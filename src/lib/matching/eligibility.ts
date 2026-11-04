/**
 * Hard eligibility gates for Match Engine V1 — run BEFORE scoring.
 * Ineligible cleaners must never receive a match score.
 */

import {
  checkCleanerAvailability,
  resolveJobDurationMinutes,
} from "@/lib/availability";
import { isDateUnavailable } from "@/lib/cleaners/unavailable-dates";
import { MATCH_THRESHOLDS } from "@/lib/matching/config";
import { arrivalWindowFromScheduledAt } from "@/lib/matching/calculateMatchScore";
import { isInServiceArea, resolveDistance } from "@/lib/matching/geo";
import type {
  MatchAvailabilitySlot,
  MatchBooking,
  MatchCleaner,
  MatchContext,
  MatchExistingJob,
} from "@/lib/matching/types";

export type EligibilityReasonCode =
  | "not_approved"
  | "inactive"
  | "offline"
  | "service_not_offered"
  | "zone_not_covered"
  | "unavailable"
  | "schedule_conflict"
  | "cannot_reach"
  | "requirements_not_met"
  | "outside_service_area"
  | "gates_incomplete";

export interface EligibilityResult {
  eligible: boolean;
  reasons: EligibilityReasonCode[];
}

export type EligibilityBooking = MatchBooking;
export type EligibilityCleaner = MatchCleaner;
export type EligibilityContext = MatchContext;

function offersService(booking: EligibilityBooking, cleaner: EligibilityCleaner): boolean {
  const offered = cleaner.offeredServiceTypes;
  if (!offered || offered.length === 0) {
    // Legacy profiles without capability rows — allow (soft open market).
    return true;
  }
  const keys = [booking.serviceType, booking.serviceId].filter(Boolean) as string[];
  return keys.some((key) => offered.includes(key));
}

function coversZone(booking: EligibilityBooking, cleaner: EligibilityCleaner): boolean {
  if (!booking.zoneId) return true;
  if (!cleaner.zoneIds || cleaner.zoneIds.length === 0) {
    // No zone assignments — fall through to travel radius check.
    return true;
  }
  return cleaner.zoneIds.includes(booking.zoneId);
}

function meetsRequirements(
  booking: EligibilityBooking,
  cleaner: EligibilityCleaner,
): boolean {
  if (booking.requiresVehicle && cleaner.hasVehicle === false) {
    return false;
  }
  const required = booking.requiredQualifications ?? [];
  if (required.length === 0) return true;
  const quals = new Set(cleaner.qualifications ?? []);
  return required.every((q) => quals.has(q));
}

function canReachJob(
  booking: EligibilityBooking,
  cleaner: EligibilityCleaner,
): { ok: boolean; unknown: boolean } {
  const distance = resolveDistance({
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

  if (distance.kind === "unknown") {
    return { ok: true, unknown: true };
  }

  const maxKm = cleaner.serviceRadiusKm || MATCH_THRESHOLDS.maxDistanceKm;
  return { ok: distance.distanceKm <= maxKm, unknown: false };
}

function hasWeeklyAvailability(
  booking: EligibilityBooking,
  cleaner: EligibilityCleaner,
  context: EligibilityContext,
): boolean {
  const slots = context.availabilityByProfileId.get(cleaner.profileId) as
    | MatchAvailabilitySlot[]
    | undefined;
  if (!slots || slots.length === 0) {
    // No rows yet → do not hard-fail (incomplete profiles).
    return true;
  }
  const windowId = arrivalWindowFromScheduledAt(booking.scheduledAt);
  const day = new Date(booking.scheduledAt).getDay();
  const dayOpen = slots.some((s) => s.dayOfWeek === day && s.isAvailable);
  if (!dayOpen) return false;
  if (!windowId) return true;
  // Exact window preferred; same-day open is still "available" for eligibility.
  return true;
}

function hasJobConflict(
  booking: EligibilityBooking,
  cleaner: EligibilityCleaner,
  context: EligibilityContext,
): boolean {
  const existing =
    (context.existingJobsByProfileId?.get(cleaner.profileId) as MatchExistingJob[] | undefined) ??
    [];
  if (existing.length === 0) return false;

  const durationMinutes = resolveJobDurationMinutes({
    durationMinutes: booking.durationMinutes,
    serviceType: booking.serviceType,
    bedrooms: booking.bedrooms,
    bathrooms: booking.bathrooms,
    extrasCount: booking.extrasKeys.length,
  });
  const travelBufferMinutes =
    context.travelBufferMinutes ?? MATCH_THRESHOLDS.travelBufferMinutes;

  const result = checkCleanerAvailability({
    cleanerId: cleaner.cleanerId,
    scheduledAt: booking.scheduledAt,
    durationMinutes,
    travelBufferMinutes,
    ignoreBookingId: booking.id,
    existingJobs: existing.map((job) => ({
      bookingId: job.bookingId,
      scheduledAt: job.scheduledAt,
      durationMinutes: job.durationMinutes,
    })),
  });

  return !result.isAvailable;
}

/**
 * Deterministic eligibility check. Pure — no I/O.
 */
export function checkEligibility(
  booking: EligibilityBooking,
  cleaner: EligibilityCleaner,
  context: EligibilityContext,
): EligibilityResult {
  const reasons: EligibilityReasonCode[] = [];

  if (!cleaner.isActive) {
    reasons.push("inactive");
  }

  const requireVerified = context.requireVerified !== false;
  const onboardingApproved =
    cleaner.onboardingStatus === undefined
      ? cleaner.isVerified
      : cleaner.onboardingStatus === "APPROVED";
  if (requireVerified && (!cleaner.isVerified || !onboardingApproved)) {
    reasons.push("not_approved");
  }

  // Platform V1 gates (identity/screening/training/etc.) when snapshot is provided.
  // Matching ranks on operational factors only — never protected characteristics.
  if (requireVerified && cleaner.platformGatesAllowed === false) {
    reasons.push("gates_incomplete");
  }

  const requireOnline = context.requireOnline !== false;
  if (requireOnline && cleaner.isOnline === false) {
    reasons.push("offline");
  }

  if (
    cleaner.unavailableDates &&
    cleaner.unavailableDates.length > 0 &&
    isDateUnavailable(booking.scheduledAt, cleaner.unavailableDates)
  ) {
    reasons.push("unavailable");
  }

  if (!offersService(booking, cleaner)) {
    reasons.push("service_not_offered");
  }

  if (!coversZone(booking, cleaner)) {
    reasons.push("zone_not_covered");
  }

  const inArea = isInServiceArea({
    postalCode: booking.addressPostalCode,
    city: booking.addressCity,
    state: booking.addressState,
    serviceAreaPostalCodes: context.serviceAreaPostalCodes,
    serviceAreaCityStates: context.serviceAreaCityStates,
  });
  if (!inArea) {
    reasons.push("outside_service_area");
  }

  const reach = canReachJob(booking, cleaner);
  if (!reach.ok) {
    reasons.push("cannot_reach");
  }

  if (!meetsRequirements(booking, cleaner)) {
    reasons.push("requirements_not_met");
  }

  if (!hasWeeklyAvailability(booking, cleaner, context)) {
    reasons.push("unavailable");
  }

  if (hasJobConflict(booking, cleaner, context)) {
    reasons.push("schedule_conflict");
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}

export function isEligible(
  booking: EligibilityBooking,
  cleaner: EligibilityCleaner,
  context: EligibilityContext,
): boolean {
  return checkEligibility(booking, cleaner, context).eligible;
}

/** Filter candidates; ineligible cleaners are dropped (never scored). */
export function filterEligibleCleaners(
  booking: EligibilityBooking,
  cleaners: EligibilityCleaner[],
  context: EligibilityContext,
): EligibilityCleaner[] {
  return cleaners.filter((cleaner) => isEligible(booking, cleaner, context));
}
