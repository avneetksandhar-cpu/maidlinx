/**
 * Authoritative server-side cleaner eligibility for marketplace offers / matching.
 * Hard gates — empty services/zones/availability never soft-pass.
 */

import {
  checkCleanerAvailability,
  resolveJobDurationMinutes,
} from "@/lib/availability";
import { isDateUnavailable } from "@/lib/cleaners/unavailable-dates";
import { getZoneById } from "@/config/markets";
import { marketSupportsService } from "@/lib/markets/eligibility";
import { MATCH_THRESHOLDS } from "@/lib/matching/config";
import { arrivalWindowFromScheduledAt } from "@/lib/matching/calculateMatchScore";
import type {
  MatchAvailabilitySlot,
  MatchBooking,
  MatchCleaner,
  MatchContext,
  MatchExistingJob,
} from "@/lib/matching/types";

export type MarketplaceEligibilityReason =
  | "not_approved"
  | "inactive"
  | "onboarding_incomplete"
  | "offline"
  | "market_not_eligible"
  | "zone_not_covered"
  | "service_not_supported"
  | "service_not_offered"
  | "unavailable"
  | "schedule_conflict"
  | "requirements_not_met"
  | "gates_incomplete"
  | "missing_availability";

export interface MarketplaceEligibilityInput {
  booking: MatchBooking;
  cleaner: MatchCleaner & {
    marketId?: string | null;
    approved?: boolean;
  };
  context: MatchContext;
  /** When true (default), cleaner must be online for offers. */
  requireOnline?: boolean;
}

export interface MarketplaceEligibilityResult {
  eligible: boolean;
  reasons: MarketplaceEligibilityReason[];
}

function offersService(booking: MatchBooking, cleaner: MatchCleaner): boolean {
  const offered = cleaner.offeredServiceTypes ?? [];
  if (offered.length === 0) return false;
  const keys = [booking.serviceType, booking.serviceId].filter(Boolean) as string[];
  return keys.some((key) => offered.includes(key));
}

function coversZone(booking: MatchBooking, cleaner: MatchCleaner): boolean {
  const zoneId = booking.zoneId;
  if (!zoneId) return false;
  const zones = cleaner.zoneIds ?? [];
  if (zones.length === 0) return false;
  return zones.includes(zoneId);
}

function marketEligible(
  booking: MatchBooking,
  cleaner: MatchCleaner & { marketId?: string | null },
): boolean {
  const bookingMarket = booking.marketId ?? null;
  if (!bookingMarket) return false;

  const cleanerMarket = cleaner.marketId ?? null;
  if (cleanerMarket && cleanerMarket === bookingMarket) return true;

  // Zone membership implies market when cleaner.market_id unset.
  const zones = cleaner.zoneIds ?? [];
  if (zones.length === 0) return false;
  return zones.some((zoneId) => getZoneById(zoneId)?.marketId === bookingMarket);
}

function meetsRequirements(booking: MatchBooking, cleaner: MatchCleaner): boolean {
  if (booking.requiresVehicle && cleaner.hasVehicle === false) return false;
  const required = booking.requiredQualifications ?? [];
  if (required.length === 0) return true;
  const quals = new Set(cleaner.qualifications ?? []);
  return required.every((q) => quals.has(q));
}

function hasWeeklyAvailability(
  booking: MatchBooking,
  cleaner: MatchCleaner,
  context: MatchContext,
): boolean {
  const slots = context.availabilityByProfileId.get(cleaner.profileId) as
    | MatchAvailabilitySlot[]
    | undefined;
  if (!slots || slots.length === 0) return false;
  const day = new Date(booking.scheduledAt).getDay();
  const dayOpen = slots.some((s) => s.dayOfWeek === day && s.isAvailable);
  if (!dayOpen) return false;
  const windowId = arrivalWindowFromScheduledAt(booking.scheduledAt);
  if (!windowId) return true;
  return true;
}

function hasJobConflict(
  booking: MatchBooking,
  cleaner: MatchCleaner,
  context: MatchContext,
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
 * Single authoritative eligibility check for marketplace fulfillment.
 */
export function checkMarketplaceCleanerEligibility(
  input: MarketplaceEligibilityInput,
): MarketplaceEligibilityResult {
  const { booking, cleaner, context } = input;
  const requireOnline = input.requireOnline ?? context.requireOnline !== false;
  const reasons: MarketplaceEligibilityReason[] = [];

  const approved =
    cleaner.approved !== undefined ? cleaner.approved : cleaner.isVerified;
  if (!approved) reasons.push("not_approved");
  if (!cleaner.isActive) reasons.push("inactive");

  const onboardingApproved =
    cleaner.onboardingStatus === undefined
      ? cleaner.isVerified
      : cleaner.onboardingStatus === "APPROVED";
  if (!onboardingApproved) reasons.push("onboarding_incomplete");

  if (context.requireVerified !== false && cleaner.platformGatesAllowed === false) {
    reasons.push("gates_incomplete");
  }

  if (requireOnline && cleaner.isOnline === false) {
    reasons.push("offline");
  }

  if (!marketEligible(booking, cleaner)) {
    reasons.push("market_not_eligible");
  }

  const serviceKey = booking.serviceId ?? booking.serviceType;
  if (booking.marketId && !marketSupportsService(booking.marketId, serviceKey)) {
    reasons.push("service_not_supported");
  }

  if (!offersService(booking, cleaner)) {
    reasons.push("service_not_offered");
  }

  if (!coversZone(booking, cleaner)) {
    reasons.push("zone_not_covered");
  }

  if (
    cleaner.unavailableDates &&
    cleaner.unavailableDates.length > 0 &&
    isDateUnavailable(booking.scheduledAt, cleaner.unavailableDates)
  ) {
    reasons.push("unavailable");
  }

  if (!hasWeeklyAvailability(booking, cleaner, context)) {
    const slots = context.availabilityByProfileId.get(cleaner.profileId);
    if (!slots || slots.length === 0) reasons.push("missing_availability");
    else reasons.push("unavailable");
  }

  if (!meetsRequirements(booking, cleaner)) {
    reasons.push("requirements_not_met");
  }

  if (hasJobConflict(booking, cleaner, context)) {
    reasons.push("schedule_conflict");
  }

  return { eligible: reasons.length === 0, reasons };
}

export function filterMarketplaceEligibleCleaners(
  booking: MatchBooking,
  cleaners: Array<MatchCleaner & { marketId?: string | null; approved?: boolean }>,
  context: MatchContext,
): MatchCleaner[] {
  return cleaners.filter(
    (cleaner) =>
      checkMarketplaceCleanerEligibility({ booking, cleaner, context }).eligible,
  );
}
