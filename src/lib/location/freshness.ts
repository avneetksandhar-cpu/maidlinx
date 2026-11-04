/** Live location is only "fresh" within this window — stale points must not drive ETA. */
export const LIVE_LOCATION_FRESH_MS = 2 * 60 * 1000;

/**
 * True when `updatedAt` is a recent ISO timestamp within {@link LIVE_LOCATION_FRESH_MS}.
 * Never invents freshness — missing/invalid stamps are stale.
 */
export function isLiveLocationFresh(
  updatedAt: string | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!updatedAt) return false;
  const ts = new Date(updatedAt).getTime();
  if (!Number.isFinite(ts)) return false;
  const age = nowMs - ts;
  return age >= 0 && age <= LIVE_LOCATION_FRESH_MS;
}
