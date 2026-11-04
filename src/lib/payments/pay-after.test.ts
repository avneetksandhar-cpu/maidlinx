import { afterEach, describe, expect, it } from "vitest";
import {
  completionChargeIdempotencyKey,
  getDueLaterCents,
  getDueNowCents,
  getPaymentTimingCopy,
  getPaymentTimingModel,
  isPayAfterCleaningEnabled,
  setupIntentIdempotencyKey,
} from "@/lib/payments/pay-after";

const ORIGINAL_SECRET = process.env.STRIPE_SECRET_KEY;
const ORIGINAL_FLAG = process.env.PAY_AFTER_CLEANING;

afterEach(() => {
  if (ORIGINAL_SECRET === undefined) delete process.env.STRIPE_SECRET_KEY;
  else process.env.STRIPE_SECRET_KEY = ORIGINAL_SECRET;
  if (ORIGINAL_FLAG === undefined) delete process.env.PAY_AFTER_CLEANING;
  else process.env.PAY_AFTER_CLEANING = ORIGINAL_FLAG;
});

describe("pay-after cleaning model", () => {
  it("defaults ON for TEST keys", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_example";
    delete process.env.PAY_AFTER_CLEANING;
    expect(isPayAfterCleaningEnabled()).toBe(true);
    expect(getPaymentTimingModel()).toBe("pay_after_cleaning");
    expect(getDueNowCents(17500)).toBe(0);
    expect(getDueLaterCents(17500)).toBe(17500);
  });

  it("is forced OFF for LIVE keys", () => {
    process.env.STRIPE_SECRET_KEY = "sk_live_example";
    process.env.PAY_AFTER_CLEANING = "true";
    expect(isPayAfterCleaningEnabled()).toBe(false);
    expect(getPaymentTimingModel()).toBe("deposit_upfront");
    expect(getDueNowCents(17500)).toBeGreaterThan(0);
  });

  it("can be disabled on TEST via flag", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_example";
    process.env.PAY_AFTER_CLEANING = "false";
    expect(isPayAfterCleaningEnabled()).toBe(false);
  });

  it("documents honest due-now copy for pay-after", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_example";
    delete process.env.PAY_AFTER_CLEANING;
    const copy = getPaymentTimingCopy(17500);
    expect(copy.dueNowCents).toBe(0);
    expect(copy.dueLaterCents).toBe(17500);
    expect(copy.requestHeadline.toLowerCase()).toContain("after");
  });

  it("uses stable idempotency keys", () => {
    expect(setupIntentIdempotencyKey("book-1")).toBe("maidlinx_setup_book-1");
    expect(completionChargeIdempotencyKey("book-1", 17500)).toBe(
      "maidlinx_complete_charge_book-1_17500",
    );
  });
});
