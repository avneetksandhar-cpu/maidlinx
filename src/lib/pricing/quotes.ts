/**
 * Authoritative server quotes — quoteId + breakdown + expiresAt.
 * Browser totals are never trusted; booking create re-asserts match.
 */

import { randomBytes } from "crypto";
import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import { calculateBookingPrice } from "@/lib/pricing/calculateQuote";
import { validatePromoCode, type AppliedPromo } from "@/lib/pricing/promos";
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

export async function createAuthoritativeQuote(
  input: BookingQuoteInput & { promoCode?: string | null },
): Promise<AuthoritativeQuote> {
  const base = calculateBookingPrice(input);
  let applied: AppliedPromo | null = null;

  if (input.promoCode && !base.quoteOnly) {
    applied = await validatePromoCode(input.promoCode, base.subtotalCents);
  }

  const pricing = applied
    ? applyDiscountToBreakdown(base, applied.discountCents)
    : { ...base, discountCents: base.discountCents ?? 0 };

  const expiresAt = new Date(Date.now() + QUOTE_TTL_MINUTES * 60_000).toISOString();
  const quoteToken = newQuoteToken();

  if (!hasAdminEnv()) {
    // Fail closed for persistence but still return ephemeral quote for local unit tests.
    return {
      ...pricing,
      quoteId: quoteToken,
      quoteToken,
      expiresAt,
      couponCode: applied?.code ?? null,
    };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("booking_quotes")
    .insert({
      quote_token: quoteToken,
      currency: pricing.currency,
      service_type: input.serviceType,
      input_snapshot: input as unknown as Json,
      breakdown: pricing as unknown as Json,
      subtotal_cents: pricing.subtotalCents,
      platform_fee_cents: pricing.platformFeeCents,
      discount_cents: pricing.discountCents ?? 0,
      total_cents: pricing.totalCents,
      coupon_code: applied?.code ?? null,
      estimated_duration_minutes: pricing.estimatedDurationMinutes ?? null,
      expires_at: expiresAt,
    })
    .select("id, quote_token, expires_at")
    .single();

  if (error || !data) {
    // Table may not be migrated yet — return ephemeral quote (still server-calculated).
    if (error && /booking_quotes|schema cache|does not exist/i.test(error.message)) {
      return {
        ...pricing,
        quoteId: quoteToken,
        quoteToken,
        expiresAt,
        couponCode: applied?.code ?? null,
      };
    }
    throw new Error(error?.message ?? "Unable to persist quote.");
  }

  return {
    ...pricing,
    quoteId: String(data.id),
    quoteToken: String(data.quote_token),
    expiresAt: String(data.expires_at),
    couponCode: applied?.code ?? null,
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
}
