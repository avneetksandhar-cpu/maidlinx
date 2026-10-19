/**
 * Cost-side factor helpers for Pricing Engine V1 audit.
 * Customer price base remains calculateBookingPrice math when dynamic is off.
 */

import {
  estimateDurationMinutes,
} from "@/lib/pricing/config";
import type { BookingServiceId } from "@/lib/bookings/constants";
import type {
  EngineScheduleContext,
  PricingEngineRules,
} from "@/lib/pricing/engine/types";

export function estimateLaborHours(input: {
  serviceType: BookingServiceId;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  extrasCount: number;
  historicalDurationMinutes?: number | null;
}): number {
  const estimated = estimateDurationMinutes({
    serviceType: input.serviceType,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    squareFootage: input.squareFootage,
    extrasCount: input.extrasCount,
  });
  const minutes =
    input.historicalDurationMinutes && input.historicalDurationMinutes > 0
      ? Math.round(
          estimated * 0.4 + input.historicalDurationMinutes * 0.6,
        )
      : estimated;
  return Math.max(0.5, Math.round((minutes / 60) * 100) / 100);
}

export function estimateCostCents(input: {
  rules: PricingEngineRules;
  laborHours: number;
  cleanerCount: number;
  complexityScore: number;
}): {
  compensationCents: number;
  travelCents: number;
  complexityCents: number;
  costEstimateCents: number;
} {
  const compensationCents = Math.round(
    input.laborHours * input.cleanerCount * input.rules.cleanerHourlyCents,
  );
  const travelCents = input.rules.travelBaseCents * input.cleanerCount;
  const complexityCents = Math.round(
    Math.max(0, Math.min(10, input.complexityScore)) *
      input.rules.complexityCentsPerPoint,
  );
  return {
    compensationCents,
    travelCents,
    complexityCents,
    costEstimateCents: compensationCents + travelCents + complexityCents,
  };
}

export function scheduleMultipliers(
  rules: PricingEngineRules,
  ctx: EngineScheduleContext | undefined,
  dynamicEnabled: boolean,
): {
  recurring: number;
  leadTime: number;
  weekend: number;
  evening: number;
} {
  let recurring = 1;
  const cadence = ctx?.recurring ?? "one_time";
  if (cadence === "weekly") recurring = rules.recurringWeeklyMult;
  else if (cadence === "biweekly") recurring = rules.recurringBiweeklyMult;
  else if (cadence === "monthly") recurring = rules.recurringMonthlyMult;

  // Recurring customer discount is a static commercial rule (not surge).
  // Lead/weekend/evening only apply when dynamic pricing is enabled.
  let leadTime = 1;
  let weekend = 1;
  let evening = 1;

  if (dynamicEnabled && ctx?.serviceDate) {
    const when = new Date(ctx.serviceDate);
    if (!Number.isNaN(when.getTime())) {
      const now = new Date();
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);
      const dayDiff = Math.floor(
        (when.getTime() - startOfToday.getTime()) / 86_400_000,
      );
      if (dayDiff <= 0) leadTime = rules.leadTimeSameDayMult;
      else if (dayDiff === 1) leadTime = rules.leadTimeNextDayMult;

      const dow = when.getDay();
      if (dow === 0 || dow === 6) weekend = rules.weekendMult;

      const hour =
        ctx.arrivalHour ??
        (ctx.serviceDate.includes("T") ? when.getHours() : null);
      if (hour != null && (hour < 8 || hour >= 18)) {
        evening = rules.eveningMult;
      }
    }
  }

  return { recurring, leadTime, weekend, evening };
}
