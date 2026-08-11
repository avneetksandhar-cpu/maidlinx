/**
 * Shared server pricing resolution for quote + booking create.
 * Keeps assertPriceMatch contract: client never trusted.
 *
 * When dynamic pricing is OFF (default) and no recurring cadence,
 * totals match legacy calculateBookingPrice exactly.
 */

import { resolveMarketOrThrow } from "@/lib/markets/eligibility";
import { calculateBookingPrice, withServerDiscount } from "@/lib/pricing/calculateQuote";
import { runPricingEngine } from "@/lib/pricing/engine/calculate";
import {
  loadDemandSupplySignals,
  loadPricingRules,
} from "@/lib/pricing/engine/rules";
import type {
  DiscountLine,
  EngineQuoteResult,
  EngineScheduleContext,
} from "@/lib/pricing/engine/types";
import { validatePromoCode, type AppliedPromo } from "@/lib/pricing/promos";
import type { PriceBreakdown } from "@/lib/pricing/types";
import type { BookingQuoteInput } from "@/lib/validations/booking-flow";
import { REFERRAL_CREDITS_LIVE } from "@/lib/referrals";

export interface ResolveServerPricingInput {
  quote: BookingQuoteInput & {
    recurringFrequency?: "one_time" | "weekly" | "biweekly" | "monthly";
    preferredDate?: string | null;
    date?: string | null;
    arrivalHour?: number | null;
    arrivalWindow?: "morning" | "afternoon" | "evening" | null;
  };
  profileId?: string | null;
  /** Optional experiment discount lines (server-assigned). */
  experimentDiscounts?: DiscountLine[];
  experimentId?: string | null;
  experimentVariant?: string | null;
  schedule?: EngineScheduleContext;
}

function arrivalHourFromWindow(
  window: "morning" | "afternoon" | "evening" | null | undefined,
): number | null {
  if (window === "morning") return 9;
  if (window === "afternoon") return 13;
  if (window === "evening") return 18;
  return null;
}

export interface ResolveServerPricingResult {
  pricing: PriceBreakdown;
  engine: EngineQuoteResult;
  appliedPromo: AppliedPromo | null;
  marketId: string | null;
}

export async function resolveServerPricing(
  input: ResolveServerPricingInput,
): Promise<ResolveServerPricingResult> {
  const marketResolve = resolveMarketOrThrow({
    postalCode: input.quote.postalCode,
    city: input.quote.city,
    state: input.quote.state,
    country: input.quote.country,
  });
  const marketId = marketResolve.market?.id ?? null;

  const [rules, signals] = await Promise.all([
    loadPricingRules(marketId),
    loadDemandSupplySignals(marketId),
  ]);

  const schedule: EngineScheduleContext = {
    serviceDate:
      input.schedule?.serviceDate ??
      input.quote.preferredDate ??
      input.quote.date ??
      null,
    arrivalHour:
      input.schedule?.arrivalHour ??
      input.quote.arrivalHour ??
      arrivalHourFromWindow(input.quote.arrivalWindow) ??
      null,
    recurring: input.schedule?.recurring ?? input.quote.recurringFrequency ?? "one_time",
    historicalDurationMinutes: input.schedule?.historicalDurationMinutes ?? null,
    complexityScore: input.schedule?.complexityScore ?? null,
    cleanerCount: input.schedule?.cleanerCount ?? null,
  };

  const discounts: DiscountLine[] = [...(input.experimentDiscounts ?? [])];
  let appliedPromo: AppliedPromo | null = null;

  // Promo validated against legacy subtotal first (stable), then stacked in engine.
  const legacyBase = calculateBookingPrice(input.quote);
  if (input.quote.promoCode && !legacyBase.quoteOnly) {
    appliedPromo = await validatePromoCode(
      input.quote.promoCode,
      legacyBase.subtotalCents,
      input.profileId,
    );
    if (appliedPromo) {
      discounts.push({
        type: "promo",
        code: appliedPromo.code,
        label: `Promo ${appliedPromo.code}`,
        amountCents: appliedPromo.discountCents,
      });
    }
  }

  // Referral credits stay gated — never add discount lines while off.
  void REFERRAL_CREDITS_LIVE;

  const needsEnginePath =
    rules.dynamicPricingEnabled ||
    (schedule.recurring && schedule.recurring !== "one_time") ||
    discounts.length > 0 ||
    Boolean(input.experimentId);

  const engine = runPricingEngine({
    quote: input.quote,
    rules,
    signals,
    schedule,
    discounts,
    experimentId: input.experimentId,
    experimentVariant: input.experimentVariant,
  });

  // Launch-safe path: when engine would not change commercial terms, prefer legacy
  // calculateBookingPrice (+ promo) so booking create stays bit-identical.
  if (!needsEnginePath) {
    return {
      pricing: { ...legacyBase, discountCents: legacyBase.discountCents ?? 0 },
      engine: {
        ...engine,
        public: { ...legacyBase, discountCents: legacyBase.discountCents ?? 0 },
      },
      appliedPromo: null,
      marketId,
    };
  }

  // Promo-only (dynamic still off, one-time): keep legacy fee math + withServerDiscount
  // when the only discount is a promo and engine didn't apply dynamic/recurring.
  if (
    !rules.dynamicPricingEnabled &&
    (!schedule.recurring || schedule.recurring === "one_time") &&
    appliedPromo &&
    !input.experimentId
  ) {
    const withPromo = {
      ...withServerDiscount(legacyBase, appliedPromo.discountCents),
      couponCode: appliedPromo.code,
    };
    // Still run guardrail via engine — if engine raised total, use engine public.
    if (
      engine.guardrailApplied &&
      engine.public.totalCents > withPromo.totalCents
    ) {
      return {
        pricing: {
          ...engine.public,
          couponCode: appliedPromo.code,
        },
        engine,
        appliedPromo,
        marketId,
      };
    }
    return {
      pricing: withPromo,
      engine: { ...engine, public: withPromo },
      appliedPromo,
      marketId,
    };
  }

  return {
    pricing: {
      ...engine.public,
      couponCode: appliedPromo?.code ?? engine.public.couponCode ?? null,
    },
    engine,
    appliedPromo,
    marketId,
  };
}
