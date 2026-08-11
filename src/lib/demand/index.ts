/**
 * Demand forecasting + cleaner incentive stubs (Marketplace V3).
 * @see docs/ALGORITHMS.md §8
 * @see docs/MARKETPLACE_ROADMAP.md
 *
 * Stubs only — do not drive promotions UI or surge pricing from these yet.
 */

export interface DemandForecastInput {
  areaId: string;
  /** Bucket start (ISO). */
  from: string;
  /** Bucket end (ISO). */
  to: string;
}

export interface DemandForecast {
  areaId: string;
  from: string;
  to: string;
  /** Expected jobs in bucket. */
  forecastedJobs: number;
  /** Active cleaners estimated available. */
  supplyEstimate: number;
  gap: number;
}

export interface IncentiveSuggestionInput {
  areaId: string;
  /** Target window (ISO). */
  from: string;
  to: string;
  /** Supply gap from forecastDemand when available. */
  gap?: number;
}

export interface IncentiveSuggestion {
  areaId: string;
  from: string;
  to: string;
  /** Suggested bonus cents for ops review — never auto-applied. */
  suggestedBonusCents: number;
  reason: string;
}

/**
 * TODO(V3): Historical booking aggregation; ops-only until surge pricing exists.
 */
export function forecastDemand(input: DemandForecastInput): DemandForecast {
  void input;
  throw new Error("TODO: src/lib/demand — forecastDemand not implemented");
}

/**
 * TODO(V3): Map supply gaps → optional cleaner bonuses.
 * Must remain ops-reviewed; never auto-promotes in customer UI.
 */
export function suggestCleanerIncentive(
  input: IncentiveSuggestionInput,
): IncentiveSuggestion {
  void input;
  throw new Error("TODO: src/lib/demand — suggestCleanerIncentive not implemented");
}
