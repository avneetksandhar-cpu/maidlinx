import { describe, expect, it } from "vitest";
import { runPricingEngine } from "@/lib/pricing/engine/calculate";
import { DEFAULT_PRICING_RULES } from "@/lib/pricing/engine/defaults";
import {
  boundDemandMultiplier,
  boundSupplyMultiplier,
  resolveDynamicMultipliers,
} from "@/lib/pricing/engine/demand-supply";
import { stackDiscounts } from "@/lib/pricing/engine/discounts";
import {
  enforceMinContributionMargin,
  maxAllowableDiscountCents,
} from "@/lib/pricing/engine/guardrails";
import { calculateBookingPrice } from "@/lib/pricing/calculateQuote";
import { pickVariant } from "@/lib/pricing/experiments";
import {
  classifyBrowserCategory,
  classifyDeviceCategory,
  sanitizeFunnelProps,
} from "@/lib/pricing/funnel-events";
import type { BookingQuoteInput } from "@/lib/validations/booking-flow";

const miami: BookingQuoteInput = {
  line1: "100 Ocean Dr",
  city: "Miami Beach",
  state: "FL",
  postalCode: "33139",
  country: "US",
  serviceType: "standard",
  bedrooms: 2,
  bathrooms: 2,
  squareFootage: 1200,
  extras: ["inside_fridge"],
};

describe("Pricing Engine V1 — parity with legacy when dynamic OFF", () => {
  it("matches calculateBookingPrice totals by default", () => {
    const legacy = calculateBookingPrice(miami);
    const engine = runPricingEngine({ quote: miami });
    expect(engine.public.totalCents).toBe(legacy.totalCents);
    expect(engine.public.subtotalCents).toBe(legacy.subtotalCents);
    expect(engine.public.platformFeeCents).toBe(legacy.platformFeeCents);
    expect(engine.dynamicPricingApplied).toBe(false);
  });

  it("stores full audit without exposing it on public breakdown", () => {
    const engine = runPricingEngine({ quote: miami });
    expect(engine.audit.engineVersion).toBe("v1");
    expect(engine.audit.costEstimateCents).toBeGreaterThan(0);
    expect(engine.audit.laborHours).toBeGreaterThan(0);
    expect(engine.public).not.toHaveProperty("calculation_audit");
    expect(JSON.stringify(engine.public)).not.toContain("cleanerHourlyCents");
  });
});

describe("demand/supply bounds", () => {
  it("returns 1.0 multipliers when dynamic disabled", () => {
    const r = resolveDynamicMultipliers(DEFAULT_PRICING_RULES, {
      demandIndex: 2,
      supplyIndex: 0.2,
      source: "manual",
    });
    expect(r.applied).toBe(false);
    expect(r.demandMultiplier).toBe(1);
    expect(r.supplyMultiplier).toBe(1);
  });

  it("clamps demand/supply within configured + hard caps when enabled", () => {
    const rules = { ...DEFAULT_PRICING_RULES, dynamicPricingEnabled: true };
    expect(boundDemandMultiplier(10, rules)).toBeLessThanOrEqual(rules.demandMultMax);
    expect(boundDemandMultiplier(0, rules)).toBeGreaterThanOrEqual(rules.demandMultMin);
    expect(boundSupplyMultiplier(0.1, rules)).toBeLessThanOrEqual(rules.supplyMultMax);
    expect(boundSupplyMultiplier(5, rules)).toBeGreaterThanOrEqual(rules.supplyMultMin);
  });

  it("applies bounded multipliers to customer total when enabled", () => {
    const rules = { ...DEFAULT_PRICING_RULES, dynamicPricingEnabled: true };
    const base = runPricingEngine({ quote: miami });
    const surged = runPricingEngine({
      quote: miami,
      rules,
      signals: { demandIndex: 1.8, supplyIndex: 0.6, source: "manual" },
    });
    expect(surged.dynamicPricingApplied).toBe(true);
    expect(surged.public.totalCents).toBeGreaterThan(base.public.totalCents);
  });
});

describe("profit guardrail", () => {
  it("raises total to meet min contribution margin", () => {
    const result = enforceMinContributionMargin({
      totalCents: 10000,
      costEstimateCents: 12000,
      rules: DEFAULT_PRICING_RULES,
    });
    expect(result.applied).toBe(true);
    expect(result.totalCents).toBeGreaterThanOrEqual(12000 + 1500);
    expect(result.contributionMarginCents).toBeGreaterThanOrEqual(1500);
  });

  it("never allows discounts that breach margin floor", () => {
    const max = maxAllowableDiscountCents({
      subtotalCents: 20000,
      platformFeeCents: 3000,
      taxCents: 0,
      costEstimateCents: 18000,
      proposedDiscountCents: 10000,
      rules: DEFAULT_PRICING_RULES,
    });
    const after = 23000 - max;
    expect(after - 18000).toBeGreaterThanOrEqual(
      DEFAULT_PRICING_RULES.minContributionMarginCents,
    );
  });

  it("engine raises price instead of quoting below margin", () => {
    const rules = {
      ...DEFAULT_PRICING_RULES,
      minContributionMarginCents: 50_000,
      minContributionMarginPct: 50,
    };
    const engine = runPricingEngine({ quote: miami, rules });
    expect(engine.guardrailApplied).toBe(true);
    expect(engine.contributionMarginCents).toBeGreaterThanOrEqual(50_000);
  });
});

describe("smart discount stack", () => {
  it("caps stacked discounts by maxDiscountStackPct", () => {
    const stacked = stackDiscounts({
      subtotalCents: 20000,
      platformFeeCents: 3000,
      costEstimateCents: 5000,
      rules: { ...DEFAULT_PRICING_RULES, maxDiscountStackPct: 25 },
      lines: [
        { type: "promo", label: "PROMO", amountCents: 4000 },
        { type: "recurring", label: "weekly", amountCents: 3000 },
        { type: "referral", label: "ref", amountCents: 2000 },
      ],
    });
    expect(stacked.totalDiscountCents).toBeLessThanOrEqual(5000);
    expect(stacked.capped).toBe(true);
  });
});

describe("experiments", () => {
  it("assigns sticky deterministic variants", () => {
    const variants = [
      { id: "control", weight: 50 },
      { id: "treatment", weight: 50 },
    ];
    const a = pickVariant("exp1", "session_abc", variants);
    const b = pickVariant("exp1", "session_abc", variants);
    expect(a).toBe(b);
    expect(["control", "treatment"]).toContain(a);
  });
});

describe("funnel privacy", () => {
  it("strips PII-like props", () => {
    const cleaned = sanitizeFunnelProps({
      step: "address",
      email: "x@y.com",
      phone: "555",
      market: "SOUTH_FLORIDA",
    });
    expect(cleaned.email).toBeUndefined();
    expect(cleaned.phone).toBeUndefined();
    expect(cleaned.market).toBe("SOUTH_FLORIDA");
  });

  it("classifies device/browser for UX analytics only", () => {
    expect(classifyDeviceCategory("Mozilla/5.0 (iPhone)")).toBe("mobile");
    expect(classifyBrowserCategory("Mozilla/5.0 Chrome/120")).toBe("chrome");
  });
});
