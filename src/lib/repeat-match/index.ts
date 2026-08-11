/**
 * Repeat-match — prefer a customer's liked / prior cleaners.
 * @see docs/ALGORITHMS.md §6
 *
 * Favorites CRUD today: `src/lib/dashboard/favorites.ts`.
 */

export interface RepeatMatchInput {
  customerId: string;
  candidateCleanerIds: string[];
}

export interface RepeatMatchBoost {
  cleanerId: string;
  /** Soft score boost 0–1 for dispatch weights. */
  boost: number;
  reasons: Array<"favorite" | "prior_completed" | "prior_high_rating">;
}

/**
 * TODO: Join favorites + completed history. Matching v1 may inline a simpler preference factor.
 */
export function getRepeatMatchBoosts(input: RepeatMatchInput): RepeatMatchBoost[] {
  void input;
  throw new Error("TODO: src/lib/repeat-match — getRepeatMatchBoosts not implemented");
}
