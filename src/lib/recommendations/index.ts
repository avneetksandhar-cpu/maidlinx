/**
 * Recommendation engine — recurring cadence and extras from history.
 * @see docs/ALGORITHMS.md §10
 */

export type RecommendationKind = "recurring_frequency" | "extra" | "service_type";

export interface Recommendation {
  kind: RecommendationKind;
  /** Catalog key or frequency token (e.g. biweekly, inside_oven). */
  key: string;
  label: string;
  confidence: number;
  reason?: string;
}

export interface RecommendationInput {
  customerId: string;
  addressId?: string;
  limit?: number;
}

/**
 * TODO: Mine booking history. Suggestions only — never auto-charge.
 */
export function recommendForCustomer(_input: RecommendationInput): Recommendation[] {
  throw new Error("TODO: src/lib/recommendations — recommendForCustomer not implemented");
}
