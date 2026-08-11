/**
 * Thin wrapper around Match Engine V1 `calculateMatchScore`.
 * Prefer this name in new call sites; do not duplicate scoring logic.
 */

import { calculateMatchScore } from "@/lib/matching/calculateMatchScore";
import type { MatchInput, MatchResult } from "@/lib/matching/types";

/** Score one eligible cleaner for a booking (0–100 + factor breakdown). */
export function scoreCleaner(input: MatchInput): MatchResult {
  return calculateMatchScore(input);
}

export { calculateMatchScore, computeMatchScore } from "@/lib/matching/calculateMatchScore";
