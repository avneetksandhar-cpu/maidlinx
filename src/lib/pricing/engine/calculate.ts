/**
 * Pricing Engine V1 — full server-side quote calculation.
 *
 * Public totals match legacy calculateBookingPrice when dynamic pricing is OFF
 * and no recurring/promo discounts are applied (default launch posture).
 *
 * Never return calculation_audit to clients.
 */

import {
  BOOKING_EXTRAS,
  getBookingServiceLabel,
  type BookingExtraId,
  type BookingServiceId,
} from "@/lib/bookings/constants";
import { isQuoteOnlyService } from "@/config/services";
import { resolveMarketOrThrow } from "@/lib/markets/eligibility";
import {
  BATHROOM_CENTS,
  BEDROOM_CENTS,
  PLATFORM_FEE_PERCENT,
  SERVICE_BASE_CENTS,
  estimateDurationMinutes,
  squareFootageAdjustment,
} from "@/lib/pricing/config";
import { DEFAULT_PRICING_RULES } from "@/lib/pricing/engine/defaults";
import {
  NEUTRAL_SIGNALS,
  resolveDynamicMultipliers,
} from "@/lib/pricing/engine/demand-supply";
import { stackDiscounts } from "@/lib/pricing/engine/discounts";
import {
  estimateCostCents,
  estimateLaborHours,
  scheduleMultipliers,
} from "@/lib/pricing/engine/factors";
import { enforceMinContributionMargin } from "@/lib/pricing/engine/guardrails";
import type {
  CalculationAudit,
  DemandSupplySignals,
  DiscountLine,
  EngineQuoteResult,
  EngineScheduleContext,
  FactorLine,
  PricingEngineRules,
} from "@/lib/pricing/engine/types";
import type { PriceBreakdown } from "@/lib/pricing/types";
import type { BookingQuoteInput } from "@/lib/validations/booking-flow";

export interface RunPricingEngineInput {
  quote: BookingQuoteInput;
  rules?: PricingEngineRules;
  signals?: DemandSupplySignals;
  schedule?: EngineScheduleContext;
  /** Pre-validated discount lines (promo/referral/experiment). Amounts in cents. */
  discounts?: DiscountLine[];
  experimentId?: string | null;
  experimentVariant?: string | null;
}

function extrasTotalCents(extras: BookingExtraId[]): number {
  return extras.reduce((sum, extraId) => {
    const extra = BOOKING_EXTRAS.find((item) => item.id === extraId);
    return sum + (extra?.priceCents ?? 0);
  }, 0);
}

function emptyQuoteOnly(
  currency: "USD" | "CAD",
  serviceLabel: string,
  input: BookingQuoteInput,
  rules: PricingEngineRules,
  marketId: string | null,
): EngineQuoteResult {
  const publicBreakdown: PriceBreakdown = {
    baseCents: 0,
    bedroomCents: 0,
    bathroomCents: 0,
    squareFootageCents: 0,
    extrasCents: 0,
    subtotalCents: 0,
    platformFeeCents: 0,
    feesCents: 0,
    taxCents: 0,
    discountCents: 0,
    totalCents: 0,
    currency,
    quoteOnly: true,
    pricingModel: "quote",
    serviceLabel,
    estimatedDurationMinutes: estimateDurationMinutes({
      serviceType: input.serviceType as BookingServiceId,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      squareFootage: input.squareFootage,
      extrasCount: input.extras.length,
    }),
  };

  const audit: CalculationAudit = {
    engineVersion: "v1",
    marketId,
    currency,
    dynamicPricingEnabled: rules.dynamicPricingEnabled,
    dynamicPricingApplied: false,
    factors: [],
    laborHours: 0,
    cleanerCount: rules.cleanersDefault,
    compensationCents: 0,
    travelCents: 0,
    complexityCents: 0,
    costEstimateCents: 0,
    demandIndex: 1,
    supplyIndex: 1,
    demandMultiplier: 1,
    supplyMultiplier: 1,
    scheduleMultipliers: {
      recurring: 1,
      leadTime: 1,
      weekend: 1,
      evening: 1,
    },
    preGuardrailTotalCents: 0,
    contributionMarginCents: 0,
    contributionMarginPct: 0,
    guardrailApplied: false,
    guardrailReason: null,
    discountStack: [],
    discountStackCapped: false,
    maxDiscountStackPct: rules.maxDiscountStackPct,
    experimentId: null,
    experimentVariant: null,
    rulesSnapshot: {
      scope: rules.scope,
      marketId: rules.marketId,
      minContributionMarginCents: rules.minContributionMarginCents,
      minContributionMarginPct: rules.minContributionMarginPct,
    },
  };

  return {
    public: publicBreakdown,
    audit,
    costEstimateCents: 0,
    contributionMarginCents: 0,
    guardrailApplied: false,
    dynamicPricingApplied: false,
    demandMultiplier: 1,
    supplyMultiplier: 1,
    discountStack: [],
  };
}

/**
 * Run the full V1 engine. Sync — rules/signals should be preloaded by caller.
 */
export function runPricingEngine(input: RunPricingEngineInput): EngineQuoteResult {
  const rules = input.rules ?? DEFAULT_PRICING_RULES;
  const signals = input.signals ?? NEUTRAL_SIGNALS;
  const quote = input.quote;
  const serviceType = quote.serviceType as BookingServiceId;
  const serviceLabel = getBookingServiceLabel(serviceType);

  const marketResolve = resolveMarketOrThrow({
    postalCode: quote.postalCode,
    city: quote.city,
    state: quote.state,
    country: quote.country,
  });
  const currency = marketResolve.market!.currency;
  const marketId = marketResolve.market?.id ?? null;

  if (isQuoteOnlyService(serviceType)) {
    return emptyQuoteOnly(currency, serviceLabel, quote, rules, marketId);
  }

  const baseCents = SERVICE_BASE_CENTS[serviceType] ?? SERVICE_BASE_CENTS.standard;
  const bedroomCents = quote.bedrooms * BEDROOM_CENTS;
  const bathroomCents = quote.bathrooms * BATHROOM_CENTS;
  const squareFootageCents = squareFootageAdjustment(quote.squareFootage);
  const extrasCents = extrasTotalCents(quote.extras as BookingExtraId[]);

  const factors: FactorLine[] = [
    { key: "market", label: "Market", cents: 0, multiplier: 1 },
    { key: "service_base", label: "Service base", cents: baseCents },
    { key: "bedrooms", label: "Bedrooms", cents: bedroomCents },
    { key: "bathrooms", label: "Bathrooms", cents: bathroomCents },
    { key: "sqft", label: "Square footage", cents: squareFootageCents },
    { key: "extras", label: "Extras", cents: extrasCents },
  ];

  const propertySubtotal =
    baseCents + bedroomCents + bathroomCents + squareFootageCents + extrasCents;

  const laborHours = estimateLaborHours({
    serviceType,
    bedrooms: quote.bedrooms,
    bathrooms: quote.bathrooms,
    squareFootage: quote.squareFootage,
    extrasCount: quote.extras.length,
    historicalDurationMinutes: input.schedule?.historicalDurationMinutes,
  });
  const cleanerCount = Math.max(
    1,
    input.schedule?.cleanerCount ?? rules.cleanersDefault,
  );
  const complexityScore = input.schedule?.complexityScore ?? 0;
  const costs = estimateCostCents({
    rules,
    laborHours,
    cleanerCount,
    complexityScore,
  });

  const { demandMultiplier, supplyMultiplier, applied: dynamicApplied } =
    resolveDynamicMultipliers(rules, signals);

  const sched = scheduleMultipliers(
    rules,
    input.schedule,
    rules.dynamicPricingEnabled,
  );

  // Customer price path:
  // 1) legacy property subtotal
  // 2) optional dynamic + day-part multipliers (off by default)
  // 3) recurring multiplier (commercial — applied to subtotal when not one_time)
  let adjustedSubtotal = propertySubtotal;
  if (dynamicApplied) {
    adjustedSubtotal = Math.round(
      propertySubtotal *
        demandMultiplier *
        supplyMultiplier *
        sched.leadTime *
        sched.weekend *
        sched.evening,
    );
  }

  // Recurring discount as a discount line (visible) rather than silent mult when < 1
  const discountLines: DiscountLine[] = [...(input.discounts ?? [])];
  if (sched.recurring < 1) {
    const recurringCut = Math.round(adjustedSubtotal * (1 - sched.recurring));
    if (recurringCut > 0) {
      discountLines.push({
        type: "recurring",
        label: `Recurring (${input.schedule?.recurring ?? "plan"})`,
        amountCents: recurringCut,
      });
    }
  }

  const platformFeeCents = Math.round(
    adjustedSubtotal * (PLATFORM_FEE_PERCENT / 100),
  );
  const taxCents = 0;

  const stacked = stackDiscounts({
    subtotalCents: adjustedSubtotal,
    platformFeeCents,
    taxCents,
    costEstimateCents: costs.costEstimateCents,
    rules,
    lines: discountLines,
  });

  const preGuardrailTotal =
    adjustedSubtotal + platformFeeCents + taxCents - stacked.totalDiscountCents;

  const guarded = enforceMinContributionMargin({
    totalCents: preGuardrailTotal,
    costEstimateCents: costs.costEstimateCents,
    rules,
  });

  // If guardrail raised total, reduce discount rather than inflate opaque fees.
  let discountCents = stacked.totalDiscountCents;
  let finalLines = stacked.lines;
  if (guarded.applied && guarded.totalCents > preGuardrailTotal) {
    const inflate = guarded.totalCents - preGuardrailTotal;
    const shrink = Math.min(discountCents, inflate);
    discountCents -= shrink;
    if (shrink > 0 && finalLines.length > 0) {
      let need = shrink;
      const cloned = finalLines.map((l) => ({ ...l }));
      for (let i = cloned.length - 1; i >= 0 && need > 0; i -= 1) {
        const cut = Math.min(cloned[i]!.amountCents, need);
        cloned[i]!.amountCents -= cut;
        need -= cut;
      }
      finalLines = cloned.filter((l) => l.amountCents > 0);
    }
  }

  const totalCents = Math.max(
    0,
    adjustedSubtotal + platformFeeCents + taxCents - discountCents,
  );
  // Re-check margin after discount shrink
  const finalGuard = enforceMinContributionMargin({
    totalCents,
    costEstimateCents: costs.costEstimateCents,
    rules,
  });
  const customerTotal = finalGuard.totalCents;
  // Any remaining gap after discount shrink becomes platform fee adjustment (opaque to formula dump)
  const feeAdjustment = Math.max(0, customerTotal - totalCents);
  const finalPlatformFee = platformFeeCents + feeAdjustment;

  const publicBreakdown: PriceBreakdown = {
    baseCents,
    bedroomCents,
    bathroomCents,
    squareFootageCents,
    extrasCents,
    subtotalCents: adjustedSubtotal,
    platformFeeCents: finalPlatformFee,
    feesCents: finalPlatformFee,
    taxCents,
    discountCents,
    totalCents: customerTotal,
    currency,
    quoteOnly: false,
    pricingModel: "instant",
    serviceLabel,
    estimatedDurationMinutes: estimateDurationMinutes({
      serviceType,
      bedrooms: quote.bedrooms,
      bathrooms: quote.bathrooms,
      squareFootage: quote.squareFootage,
      extrasCount: quote.extras.length,
    }),
  };

  const audit: CalculationAudit = {
    engineVersion: "v1",
    marketId,
    currency,
    dynamicPricingEnabled: rules.dynamicPricingEnabled,
    dynamicPricingApplied: dynamicApplied,
    factors,
    laborHours,
    cleanerCount,
    compensationCents: costs.compensationCents,
    travelCents: costs.travelCents,
    complexityCents: costs.complexityCents,
    costEstimateCents: costs.costEstimateCents,
    demandIndex: signals.demandIndex,
    supplyIndex: signals.supplyIndex,
    demandMultiplier,
    supplyMultiplier,
    scheduleMultipliers: sched,
    preGuardrailTotalCents: preGuardrailTotal,
    contributionMarginCents: finalGuard.contributionMarginCents,
    contributionMarginPct: finalGuard.contributionMarginPct,
    guardrailApplied: finalGuard.applied || guarded.applied,
    guardrailReason: finalGuard.reason ?? guarded.reason,
    discountStack: finalLines,
    discountStackCapped: stacked.capped,
    maxDiscountStackPct: rules.maxDiscountStackPct,
    experimentId: input.experimentId ?? null,
    experimentVariant: input.experimentVariant ?? null,
    rulesSnapshot: {
      scope: rules.scope,
      marketId: rules.marketId,
      minContributionMarginCents: rules.minContributionMarginCents,
      minContributionMarginPct: rules.minContributionMarginPct,
    },
  };

  return {
    public: publicBreakdown,
    audit,
    costEstimateCents: costs.costEstimateCents,
    contributionMarginCents: finalGuard.contributionMarginCents,
    guardrailApplied: audit.guardrailApplied,
    dynamicPricingApplied: dynamicApplied,
    demandMultiplier,
    supplyMultiplier,
    discountStack: finalLines,
  };
}

/**
 * Legacy-compatible sync calculator used by booking create.
 * Equivalent to runPricingEngine with defaults (dynamic OFF, no discounts).
 */
export function calculateBookingPriceViaEngine(
  quote: BookingQuoteInput,
): PriceBreakdown {
  return runPricingEngine({ quote }).public;
}
