/**
 * Cleaner reliability score — completions, lateness, cancellations, ratings, disputes.
 * @see docs/ALGORITHMS.md §5
 */

export interface ReliabilityComponents {
  completionRate: number;
  cancellationRate: number;
  /** Share of jobs arrived within window; 0–1 when known. */
  onTimeRate: number;
  ratingAverage: number;
  ratingCount: number;
  disputeCount: number;
}

export interface ReliabilityScore {
  cleanerId: string;
  /** Aggregate 0–100 once implemented. */
  score: number;
  components: ReliabilityComponents;
  computedAt: string;
}

/**
 * TODO: Aggregate from bookings, reviews, disputes. Until then, matching may use raw rating fields.
 */
export function computeReliabilityScore(_cleanerId: string): ReliabilityScore {
  throw new Error("TODO: src/lib/reliability — computeReliabilityScore not implemented");
}
