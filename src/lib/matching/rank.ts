import { DEFAULT_MATCH_LIMIT } from "@/lib/matching/config";
import {
  filterEligibleCleaners,
  type EligibilityBooking,
  type EligibilityCleaner,
  type EligibilityContext,
} from "@/lib/matching/eligibility";
import { calculateMatchScore } from "@/lib/matching/calculateMatchScore";
import type { ScoredCleaner } from "@/lib/matching/types";

export interface RankCleanersOptions {
  /** Max results to return (default DEFAULT_MATCH_LIMIT). */
  limit?: number;
  /**
   * @deprecated Prefer eligibility gates. When false with skipEligibility,
   * include inactive cleaners.
   */
  activeOnly?: boolean;
  /** When true, skip hard eligibility (tests / admin override only). */
  skipEligibility?: boolean;
}

/**
 * Rank cleaners for a booking by Match Score (highest first).
 * Eligibility runs FIRST — ineligible cleaners are never scored.
 */
export function rankCleanersForBooking(
  booking: EligibilityBooking,
  cleaners: EligibilityCleaner[],
  context: EligibilityContext,
  options: RankCleanersOptions = {},
): ScoredCleaner[] {
  const limit = options.limit ?? DEFAULT_MATCH_LIMIT;

  let candidates: EligibilityCleaner[];
  if (options.skipEligibility) {
    const activeOnly = options.activeOnly ?? true;
    candidates = activeOnly ? cleaners.filter((c) => c.isActive) : cleaners;
  } else {
    candidates = filterEligibleCleaners(booking, cleaners, context);
  }

  const scored: ScoredCleaner[] = candidates.map((cleaner) => {
    const result = calculateMatchScore({ booking, cleaner, context });
    return {
      profileId: cleaner.profileId,
      cleanerId: cleaner.cleanerId,
      name: cleaner.name,
      score: result.score,
      factors: result.factors,
      reasonChips: result.reasonChips,
      breakdown: result.breakdown,
    };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.name.localeCompare(b.name);
  });

  return scored.slice(0, limit);
}

/** Marketplace / docs alias. */
export function rankCleaners(
  booking: EligibilityBooking,
  cleaners: EligibilityCleaner[],
  context: EligibilityContext,
  options?: RankCleanersOptions,
): ScoredCleaner[] {
  return rankCleanersForBooking(booking, cleaners, context, options);
}
