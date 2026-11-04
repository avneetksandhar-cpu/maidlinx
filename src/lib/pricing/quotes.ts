/**
 * Authoritative server quotes — quoteId + breakdown + expiresAt.
 * Browser totals are never trusted; booking create re-asserts match.
 * Persists pricing_quotes audit (server-only) when DB available.
 */

import { randomBytes } from "crypto";
import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import { calculateBookingPrice } from "@/lib/pricing/calculateQuote";
import { validatePromoCode, type AppliedPromo } from "@/lib/pricing/promos";
import { resolveServerPricing } from "@/lib/pricing/resolve";
import type { CalculationAudit, DiscountLine } from "@/lib/pricing/engine/types";
import type { PriceBreakdown } from "@/lib/pricing/types";
import type { BookingQuoteInput } from "@/lib/validations/booking-flow";
import type { Json } from "@/types/database.types";

export const QUOTE_TTL_MINUTES = 30;

export interface AuthoritativeQuote extends PriceBreakdown {
  quoteId: string;
  quoteToken: string;
  expiresAt: string;
  couponCode?: string | null;
}

function newQuoteToken(): string {
  return `qt_${randomBytes(18).toString("base64url")}`;
}

export function applyDiscountToBreakdown(
  base: PriceBreakdown,
  discountCents: number,
): PriceBreakdown {
  const safeDiscount = Math.max(0, Math.min(base.subtotalCents, discountCents));
  const totalCents = Math.max(
    0,
    base.subtotalCents + base.platformFeeCents + (base.taxCents ?? 0) - safeDiscount,
  );
  return {
    ...base,
    discountCents: safeDiscount,
    totalCents,
  };
}

async function persistPricingQuoteAudit(input: {
  bookingQuoteId: string | null;
  quoteToken: string;
  marketId: string | null;
  serviceType: string;
  inputSnapshot: unknown;
  pricing: PriceBreakdown;
  audit: CalculationAudit;
  costEstimateCents: number;
  contributionMarginCents: number;
  guardrailApplied: boolean;
  dynamicPricingApplied: boolean;
  demandMultiplier: number;
  supplyMultiplier: number;
  experimentId: string | null;
  experimentVariant: string | null;
  discountStack: DiscountLine[];
  expiresAt: string;
}): Promise<void> {
  if (!hasAdminEnv()) return;
  const supabase = createAdminClient();
  const { error } = await supabase.from("pricing_quotes").insert({
    booking_quote_id: input.bookingQuoteId,
    quote_token: input.quoteToken,
    market_id: input.marketId,
    currency: input.pricing.currency,
    service_type: input.serviceType,
    input_snapshot: input.inputSnapshot as Json,
    public_breakdown: input.pricing as unknown as Json,
    calculation_audit: input.audit as unknown as Json,
    cost_estimate_cents: input.costEstimateCents,
    contribution_margin_cents: input.contributionMarginCents,
    guardrail_applied: input.guardrailApplied,
    dynamic_pricing_applied: input.dynamicPricingApplied,
    demand_multiplier: input.demandMultiplier,
    supply_multiplier: input.supplyMultiplier,
    experiment_id: input.experimentId,
    experiment_variant: input.experimentVariant,
    discount_stack: input.discountStack as unknown as Json,
    subtotal_cents: input.pricing.subtotalCents,
    platform_fee_cents: input.pricing.platformFeeCents,
    discount_cents: input.pricing.discountCents ?? 0,
    total_cents: input.pricing.totalCents,
    expires_at: input.expiresAt,
  });

  if (error && !/pricing_quotes|schema cache|does not exist/i.test(error.message)) {
    console.error("[pricing_quotes] persist failed:", error.message);
  }
}

export async function createAuthoritativeQuote(
  input: BookingQuoteInput & {
    promoCode?: string | null;
    recurringFrequency?: "one_time" | "weekly" | "biweekly" | "monthly";
    date?: string;
    arrivalWindow?: "morning" | "afternoon" | "evening";
    anonymousSessionId?: string | null;
    experimentId?: string | null;
    experimentVariant?: string | null;
  },
  options?: {
    profileId?: string | null;
    experimentDiscounts?: DiscountLine[];
  },
): Promise<AuthoritativeQuote> {
  const arrivalHour =
    input.arrivalWindow === "morning"
      ? 9
      : input.arrivalWindow === "afternoon"
        ? 13
        : input.arrivalWindow === "evening"
          ? 18
          : null;

  const resolved = await resolveServerPricing({
    quote: {
      ...input,
      preferredDate: input.date,
      arrivalHour: arrivalHour ?? undefined,
    },
    profileId: options?.profileId,
    experimentDiscounts: options?.experimentDiscounts,
    experimentId: input.experimentId,
    experimentVariant: input.experimentVariant,
    schedule: {
      serviceDate: input.date,
      arrivalHour,
      recurring: input.recurringFrequency ?? "one_time",
    },
  });

  const pricing = resolved.pricing;
  const expiresAt = new Date(Date.now() + QUOTE_TTL_MINUTES * 60_000).toISOString();
  const quoteToken = newQuoteToken();

  if (!hasAdminEnv()) {
    return {
      ...pricing,
      quoteId: quoteToken,
      quoteToken,
      expiresAt,
      couponCode: resolved.appliedPromo?.code ?? pricing.couponCode ?? null,
    };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("booking_quotes")
    .insert({
      quote_token: quoteToken,
      market_id: resolved.marketId,
      currency: pricing.currency,
      service_type: input.serviceType,
      input_snapshot: input as unknown as Json,
      breakdown: pricing as unknown as Json,
      subtotal_cents: pricing.subtotalCents,
      platform_fee_cents: pricing.platformFeeCents,
      discount_cents: pricing.discountCents ?? 0,
      total_cents: pricing.totalCents,
      coupon_code: resolved.appliedPromo?.code ?? null,
      estimated_duration_minutes: pricing.estimatedDurationMinutes ?? null,
      expires_at: expiresAt,
    })
    .select("id, quote_token, expires_at")
    .single();

  if (error || !data) {
    if (error && /booking_quotes|schema cache|does not exist/i.test(error.message)) {
      await persistPricingQuoteAudit({
        bookingQuoteId: null,
        quoteToken,
        marketId: resolved.marketId,
        serviceType: input.serviceType,
        inputSnapshot: input,
        pricing,
        audit: resolved.engine.audit,
        costEstimateCents: resolved.engine.costEstimateCents,
        contributionMarginCents: resolved.engine.contributionMarginCents,
        guardrailApplied: resolved.engine.guardrailApplied,
        dynamicPricingApplied: resolved.engine.dynamicPricingApplied,
        demandMultiplier: resolved.engine.demandMultiplier,
        supplyMultiplier: resolved.engine.supplyMultiplier,
        experimentId: input.experimentId ?? null,
        experimentVariant: input.experimentVariant ?? null,
        discountStack: resolved.engine.discountStack,
        expiresAt,
      });
      return {
        ...pricing,
        quoteId: quoteToken,
        quoteToken,
        expiresAt,
        couponCode: resolved.appliedPromo?.code ?? null,
      };
    }
    throw new Error(error?.message ?? "Unable to persist quote.");
  }

  const bookingQuoteId = String(data.id);

  await persistPricingQuoteAudit({
    bookingQuoteId,
    quoteToken: String(data.quote_token),
    marketId: resolved.marketId,
    serviceType: input.serviceType,
    inputSnapshot: input,
    pricing,
    audit: resolved.engine.audit,
    costEstimateCents: resolved.engine.costEstimateCents,
    contributionMarginCents: resolved.engine.contributionMarginCents,
    guardrailApplied: resolved.engine.guardrailApplied,
    dynamicPricingApplied: resolved.engine.dynamicPricingApplied,
    demandMultiplier: resolved.engine.demandMultiplier,
    supplyMultiplier: resolved.engine.supplyMultiplier,
    experimentId: input.experimentId ?? null,
    experimentVariant: input.experimentVariant ?? null,
    discountStack: resolved.engine.discountStack,
    expiresAt: String(data.expires_at),
  });

  return {
    ...pricing,
    quoteId: bookingQuoteId,
    quoteToken: String(data.quote_token),
    expiresAt: String(data.expires_at),
    couponCode: resolved.appliedPromo?.code ?? null,
  };
}

export async function loadQuoteById(quoteId: string): Promise<{
  id: string;
  quoteToken: string;
  totalCents: number;
  expiresAt: string;
  breakdown: PriceBreakdown;
  couponCode: string | null;
  consumedByBookingId: string | null;
} | null> {
  if (!hasAdminEnv()) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("booking_quotes")
    .select("*")
    .eq("id", quoteId)
    .maybeSingle();

  if (error) {
    if (/booking_quotes|does not exist/i.test(error.message)) return null;
    throw new Error(error.message);
  }
  if (!data) return null;

  const row = data as Record<string, unknown>;
  return {
    id: String(row.id),
    quoteToken: String(row.quote_token),
    totalCents: Number(row.total_cents),
    expiresAt: String(row.expires_at),
    breakdown: row.breakdown as PriceBreakdown,
    couponCode: row.coupon_code ? String(row.coupon_code) : null,
    consumedByBookingId: row.consumed_by_booking_id
      ? String(row.consumed_by_booking_id)
      : null,
  };
}

export function assertQuoteNotExpired(expiresAt: string, now = Date.now()): void {
  if (new Date(expiresAt).getTime() < now) {
    throw new Error("Quote expired. Request a new quote.");
  }
}

export async function markQuoteConsumed(quoteId: string, bookingId: string): Promise<void> {
  if (!hasAdminEnv()) return;
  const supabase = createAdminClient();
  await supabase
    .from("booking_quotes")
    .update({ consumed_by_booking_id: bookingId })
    .eq("id", quoteId)
    .is("consumed_by_booking_id", null);

  await supabase
    .from("pricing_quotes")
    .update({ consumed_by_booking_id: bookingId })
    .eq("booking_quote_id", quoteId)
    .is("consumed_by_booking_id", null);
}

/** @deprecated Prefer createAuthoritativeQuote; kept for call sites that used calculate + promo. */
export async function legacyQuoteWithPromo(
  input: BookingQuoteInput & { promoCode?: string | null },
): Promise<{ pricing: PriceBreakdown; applied: AppliedPromo | null }> {
  const base = calculateBookingPrice(input);
  let applied: AppliedPromo | null = null;
  if (input.promoCode && !base.quoteOnly) {
    applied = await validatePromoCode(input.promoCode, base.subtotalCents);
  }
  const pricing = applied
    ? applyDiscountToBreakdown(base, applied.discountCents)
    : { ...base, discountCents: base.discountCents ?? 0 };
  return { pricing, applied };
}
