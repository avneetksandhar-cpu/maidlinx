/**
 * MaidLinx Brain V1 — shared constants & types.
 * Deterministic, bounded, auditable. No LLM authority over money/safety.
 */

/** Minimum historical samples before a numeric forecast is emitted. */
export const BRAIN_MIN_SAMPLE_SIZE = 10;

/** Confidence floor when sample is exactly at minimum. */
export const BRAIN_MIN_CONFIDENCE = 0.35;

export const BRAIN_EVENT_TYPES = [
  "funnel_step",
  "booking_created",
  "booking_paid",
  "booking_completed",
  "booking_cancelled",
  "offer_created",
  "offer_accepted",
  "offer_declined",
  "offer_expired",
  "admin_assigned",
  "review_submitted",
  "capacity_watch",
  "rebook_started",
] as const;

export type BrainEventType = (typeof BRAIN_EVENT_TYPES)[number];

export type ForecastStatus = "ok" | "INSUFFICIENT_DATA";

export type CapacityLabel =
  | "plenty"
  | "balanced"
  | "tight"
  | "overbooked"
  | "INSUFFICIENT_DATA";

export interface ForecastResult<T> {
  status: ForecastStatus;
  sampleSize: number;
  confidence: number;
  marketId: string;
  horizon: "next_24h" | "next_7d" | "next_30d";
  value: T | null;
  reason?: string;
}

export function confidenceFromSample(sampleSize: number): number {
  if (sampleSize < BRAIN_MIN_SAMPLE_SIZE) return 0;
  // Asymptotic toward 0.95 — never claim certainty.
  const raw = 1 - Math.exp(-(sampleSize - BRAIN_MIN_SAMPLE_SIZE) / 40);
  return Math.min(0.95, Math.max(BRAIN_MIN_CONFIDENCE, Number(raw.toFixed(4))));
}

/** Strip keys that look like PII from brain payloads. */
export function sanitizeBrainPayload(
  input: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!input) return {};
  const blocked =
    /email|phone|address|line1|line2|postal|card|ssn|password|token|secret|name/i;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (blocked.test(key)) continue;
    if (typeof value === "string" && value.includes("@")) continue;
    out[key] = value;
  }
  return out;
}
