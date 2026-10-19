import { describe, expect, it } from "vitest";
import { computeDiscountCents, assertCouponCurrentlyValid } from "@/lib/pricing/promos";
import type { Coupon } from "@/lib/admin/coupons";

const base: Coupon = {
  id: "1",
  code: "FLAT20",
  description: null,
  discountType: "fixed",
  discountValue: 2000,
  minOrderCents: 5000,
  maxUses: null,
  maxUsesPerCustomer: null,
  usedCount: 0,
  validFrom: null,
  validUntil: null,
  isActive: true,
  createdAt: new Date().toISOString(),
};

describe("computeDiscountCents", () => {
  it("rejects below minimum subtotal", () => {
    expect(() => computeDiscountCents(base, 1000)).toThrow(/minimum subtotal/i);
  });

  it("applies fixed discount", () => {
    expect(computeDiscountCents(base, 10000)).toBe(2000);
  });

  it("caps fixed discount at subtotal", () => {
    expect(
      computeDiscountCents({ ...base, discountValue: 50000, minOrderCents: 0 }, 3000),
    ).toBe(3000);
  });
});

describe("assertCouponCurrentlyValid", () => {
  it("rejects expired coupons", () => {
    expect(() =>
      assertCouponCurrentlyValid({
        ...base,
        validUntil: "2020-01-01T00:00:00.000Z",
      }),
    ).toThrow(/expired/i);
  });
});
