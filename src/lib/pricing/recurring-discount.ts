/**
 * Recurring cleaning discount — honest commercial rates from Pricing Engine defaults.
 *
 * Documented rates (off subtotal; platform fee still on pre-discount subtotal):
 * - weekly:   10% off (multiplier 0.9)
 * - biweekly:  7% off (multiplier 0.93)
 * - monthly:   3% off (multiplier 0.97)
 * - one_time:  no discount
 *
 * Server path: `runPricingEngine` / `resolveServerPricing` when cadence ≠ one_time.
 * Client preview: `calculateBookingPrice` applies the same cut for snappy UI.
 * Stripe LIVE stays OFF; this only reduces the first-clean total/deposit (no subscriptions).
 */

import { DEFAULT_PRICING_RULES } from "@/lib/pricing/engine/defaults";
import type { RecurringCadence } from "@/lib/pricing/engine/types";

export const RECURRING_DISCOUNT_LABEL = "Recurring discount";

/** Multipliers matching DEFAULT_PRICING_RULES (single source of truth). */
export function recurringMultiplier(
  cadence: RecurringCadence | null | undefined,
): number {
  switch (cadence) {
    case "weekly":
      return DEFAULT_PRICING_RULES.recurringWeeklyMult;
    case "biweekly":
      return DEFAULT_PRICING_RULES.recurringBiweeklyMult;
    case "monthly":
      return DEFAULT_PRICING_RULES.recurringMonthlyMult;
    default:
      return 1;
  }
}

/** Whole-number percent off (e.g. weekly → 10). */
export function recurringDiscountOffPercent(
  cadence: RecurringCadence | null | undefined,
): number {
  const mult = recurringMultiplier(cadence);
  if (mult >= 1) return 0;
  return Math.round((1 - mult) * 100);
}

/** Discount cents from property subtotal (same formula as pricing engine). */
export function recurringDiscountCents(
  subtotalCents: number,
  cadence: RecurringCadence | null | undefined,
): number {
  const mult = recurringMultiplier(cadence);
  if (mult >= 1 || subtotalCents <= 0) return 0;
  return Math.max(0, Math.round(subtotalCents * (1 - mult)));
}

export function isRecurringDiscountCadence(
  cadence: string | null | undefined,
): cadence is Exclude<RecurringCadence, "one_time"> {
  return cadence === "weekly" || cadence === "biweekly" || cadence === "monthly";
}
