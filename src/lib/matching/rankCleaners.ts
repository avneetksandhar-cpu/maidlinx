/**
 * Re-export marketplace naming — implementation lives in `rank.ts`
 * so we do not duplicate ranking logic.
 */
export {
  rankCleaners,
  rankCleanersForBooking,
  type RankCleanersOptions,
} from "@/lib/matching/rank";
