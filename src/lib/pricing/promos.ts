/**
 * Server-side coupon / promo validation.
 * Never trust a browser-supplied discount amount.
 */

import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import type { Coupon } from "@/lib/admin/coupons";

export class PromoValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PromoValidationError";
  }
}

export function computeDiscountCents(
  coupon: Pick<Coupon, "discountType" | "discountValue" | "minOrderCents">,
  subtotalCents: number,
): number {
  if (subtotalCents < coupon.minOrderCents) {
    throw new PromoValidationError(
      `Promo requires a minimum subtotal of ${coupon.minOrderCents} cents.`,
    );
  }

  if (coupon.discountType === "percent") {
    const pct = Math.min(100, Math.max(0, coupon.discountValue));
    return Math.min(subtotalCents, Math.round((subtotalCents * pct) / 100));
  }

  return Math.min(subtotalCents, Math.max(0, coupon.discountValue));
}

function mapCoupon(row: Record<string, unknown>): Coupon {
  return {
    id: String(row.id),
    code: String(row.code),
    description: row.description ? String(row.description) : null,
    discountType: row.discount_type as "percent" | "fixed",
    discountValue: Number(row.discount_value),
    minOrderCents: Number(row.min_order_cents),
    maxUses: row.max_uses != null ? Number(row.max_uses) : null,
    usedCount: Number(row.used_count ?? 0),
    validFrom: row.valid_from ? String(row.valid_from) : null,
    validUntil: row.valid_until ? String(row.valid_until) : null,
    isActive: Boolean(row.is_active),
    createdAt: String(row.created_at),
  };
}

export async function loadActiveCoupon(code: string): Promise<Coupon | null> {
  if (!hasAdminEnv()) return null;
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", normalized)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    if (/coupons|schema cache|does not exist/i.test(error.message)) return null;
    throw new Error(error.message);
  }
  if (!data) return null;
  return mapCoupon(data as Record<string, unknown>);
}

export function assertCouponCurrentlyValid(coupon: Coupon, now = new Date()): void {
  if (!coupon.isActive) {
    throw new PromoValidationError("This promo code is inactive.");
  }
  if (coupon.validFrom && new Date(coupon.validFrom).getTime() > now.getTime()) {
    throw new PromoValidationError("This promo code is not valid yet.");
  }
  if (coupon.validUntil && new Date(coupon.validUntil).getTime() < now.getTime()) {
    throw new PromoValidationError("This promo code has expired.");
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    throw new PromoValidationError("This promo code has reached its usage limit.");
  }
}

export interface AppliedPromo {
  coupon: Coupon;
  discountCents: number;
  code: string;
}

/**
 * Validate promo against live coupon row and return server discount.
 */
export async function validatePromoCode(
  code: string | null | undefined,
  subtotalCents: number,
): Promise<AppliedPromo | null> {
  if (!code?.trim()) return null;

  const coupon = await loadActiveCoupon(code);
  if (!coupon) {
    throw new PromoValidationError("Invalid promo code.");
  }

  assertCouponCurrentlyValid(coupon);
  const discountCents = computeDiscountCents(coupon, subtotalCents);

  return {
    coupon,
    discountCents,
    code: coupon.code,
  };
}

export async function recordCouponRedemption(input: {
  couponId: string;
  bookingId: string;
  customerId?: string | null;
  discountCents: number;
}): Promise<void> {
  if (!hasAdminEnv()) return;
  const supabase = createAdminClient();

  const { error: redeemError } = await supabase.from("coupon_redemptions").insert({
    coupon_id: input.couponId,
    booking_id: input.bookingId,
    customer_id: input.customerId ?? null,
    discount_cents: input.discountCents,
  });

  if (redeemError && !/coupon_redemptions|duplicate|unique/i.test(redeemError.message)) {
    console.error("[promo] redemption insert failed:", redeemError.message);
  }

  // Best-effort increment; unique booking redemption prevents double-count races.
  const { data: coupon } = await supabase
    .from("coupons")
    .select("used_count")
    .eq("id", input.couponId)
    .maybeSingle();

  if (coupon) {
    await supabase
      .from("coupons")
      .update({ used_count: Number(coupon.used_count ?? 0) + 1 })
      .eq("id", input.couponId);
  }
}
