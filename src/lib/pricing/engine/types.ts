/**
 * Pricing Engine V1 — internal types.
 * calculation_audit must NEVER be returned to the browser.
 */

import type { PriceBreakdown } from "@/lib/pricing/types";

export type RecurringCadence = "one_time" | "weekly" | "biweekly" | "monthly";

export interface PricingEngineRules {
  scope: "global" | "market";
  marketId: string | null;
  dynamicPricingEnabled: boolean;
  demandMultMin: number;
  demandMultMax: number;
  supplyMultMin: number;
  supplyMultMax: number;
  minTotalCents: number | null;
  maxTotalCents: number | null;
  minContributionMarginCents: number;
  minContributionMarginPct: number;
  cleanerHourlyCents: number;
  cleanersDefault: number;
  travelBaseCents: number;
  complexityCentsPerPoint: number;
  recurringWeeklyMult: number;
  recurringBiweeklyMult: number;
  recurringMonthlyMult: number;
  leadTimeSameDayMult: number;
  leadTimeNextDayMult: number;
  weekendMult: number;
  eveningMult: number;
  maxDiscountStackPct: number;
  params: Record<string, unknown>;
}

export interface DemandSupplySignals {
  demandIndex: number;
  supplyIndex: number;
  source: "default" | "manual" | "computed" | "import";
}

export interface EngineScheduleContext {
  /** Preferred service date (ISO date or datetime). */
  serviceDate?: string | null;
  /** Arrival window start hour 0–23 when known. */
  arrivalHour?: number | null;
  recurring?: RecurringCadence | null;
  /** Historical avg duration minutes for similar jobs (ops signal). */
  historicalDurationMinutes?: number | null;
  /** Complexity 0–10 from property/access answers. */
  complexityScore?: number | null;
  /** Override cleaner count when known. */
  cleanerCount?: number | null;
}

export interface DiscountLine {
  type: "promo" | "referral" | "recurring" | "experiment" | "other";
  code?: string | null;
  label: string;
  amountCents: number;
}

export interface FactorLine {
  key: string;
  label: string;
  cents: number;
  multiplier?: number;
}

export interface CalculationAudit {
  engineVersion: "v1";
  marketId: string | null;
  currency: "USD" | "CAD";
  dynamicPricingEnabled: boolean;
  dynamicPricingApplied: boolean;
  factors: FactorLine[];
  laborHours: number;
  cleanerCount: number;
  compensationCents: number;
  travelCents: number;
  complexityCents: number;
  costEstimateCents: number;
  demandIndex: number;
  supplyIndex: number;
  demandMultiplier: number;
  supplyMultiplier: number;
  scheduleMultipliers: {
    recurring: number;
    leadTime: number;
    weekend: number;
    evening: number;
  };
  preGuardrailTotalCents: number;
  contributionMarginCents: number;
  contributionMarginPct: number;
  guardrailApplied: boolean;
  guardrailReason: string | null;
  discountStack: DiscountLine[];
  discountStackCapped: boolean;
  maxDiscountStackPct: number;
  experimentId: string | null;
  experimentVariant: string | null;
  rulesSnapshot: {
    scope: string;
    marketId: string | null;
    minContributionMarginCents: number;
    minContributionMarginPct: number;
  };
}

export interface EngineQuoteResult {
  /** Customer-facing breakdown — safe for API responses. */
  public: PriceBreakdown;
  /** Server-only audit — persist, never serialize to clients. */
  audit: CalculationAudit;
  costEstimateCents: number;
  contributionMarginCents: number;
  guardrailApplied: boolean;
  dynamicPricingApplied: boolean;
  demandMultiplier: number;
  supplyMultiplier: number;
  discountStack: DiscountLine[];
}
