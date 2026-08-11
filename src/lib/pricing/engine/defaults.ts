/**
 * Default Pricing Engine V1 rules.
 * Dynamic pricing is OFF until admin enables globally or by market.
 */

import type { PricingEngineRules } from "@/lib/pricing/engine/types";

export const PRICING_ENGINE_VERSION = "v1" as const;

/** Hard safety caps even if admin misconfigures (still within DB check bounds). */
export const HARD_DEMAND_MULT_FLOOR = 0.85;
export const HARD_DEMAND_MULT_CEILING = 1.25;
export const HARD_SUPPLY_MULT_FLOOR = 0.9;
export const HARD_SUPPLY_MULT_CEILING = 1.2;

export const DEFAULT_PRICING_RULES: PricingEngineRules = {
  scope: "global",
  marketId: null,
  dynamicPricingEnabled: false,
  demandMultMin: 0.9,
  demandMultMax: 1.15,
  supplyMultMin: 0.95,
  supplyMultMax: 1.1,
  minTotalCents: null,
  maxTotalCents: null,
  minContributionMarginCents: 1500,
  minContributionMarginPct: 12,
  cleanerHourlyCents: 2800,
  cleanersDefault: 1,
  travelBaseCents: 500,
  complexityCentsPerPoint: 250,
  recurringWeeklyMult: 0.9,
  recurringBiweeklyMult: 0.93,
  recurringMonthlyMult: 0.97,
  leadTimeSameDayMult: 1.08,
  leadTimeNextDayMult: 1.04,
  weekendMult: 1.05,
  eveningMult: 1.03,
  maxDiscountStackPct: 25,
  params: {},
};

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
